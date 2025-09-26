import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CustomSurfaceData, CustomSurfaceZone } from '../../services/project-state.service';

declare const fabric: any;

@Component({
  selector: 'app-surface-editor',
  templateUrl: './surface-editor.component.html',
  styleUrls: ['./surface-editor.component.css']
})
export class SurfaceEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() customSurface: CustomSurfaceData | null = null;
  @Output() readonly zonesChange = new EventEmitter<CustomSurfaceZone[]>();

  zones: CustomSurfaceZone[] = [];
  private canvas?: any;
  private nextZoneIndex = 1;
  selectedZoneId: string | null = null;
  backgroundName = '';
  fabricUnavailable = false;
  private backgroundUrl: string | null = null;
  private pendingBackgroundUrl: string | null = null;
  private pendingZones: CustomSurfaceZone[] | null = null;
  private isRestoringZones = false;
  isCreatingZone = false;
  private creationPoints: { x: number; y: number }[] = [];
  private creationPreviewPoint: { x: number; y: number } | null = null;
  private creationPolyline?: any;
  private creationPointMarkers: any[] = [];
  private creationStartMarker?: any;
  private readonly canvasClickHandler = (event: any) => this.handleCanvasClick(event);
  private readonly canvasMoveHandler = (event: any) => this.handleCanvasMove(event);
  private readonly canvasDoubleClickHandler = (event: any) => this.handleCanvasDoubleClick(event);
  private readonly keyDownHandler = (event: KeyboardEvent) => this.handleKeyDown(event);

  ngAfterViewInit(): void {
    if (typeof fabric === 'undefined') {
      this.fabricUnavailable = true;
      return;
    }

    this.canvas = new fabric.Canvas(this.canvasRef.nativeElement, {
      selection: true,
      preserveObjectStacking: true
    });

    this.canvas.on('object:modified', () => this.syncZonesFromCanvas());
    this.canvas.on('object:moving', () => this.syncZonesFromCanvas());
    this.canvas.on('object:scaling', () => this.syncZonesFromCanvas());
    this.canvas.on('selection:created', (event: any) => this.onSelection(event));
    this.canvas.on('selection:updated', (event: any) => this.onSelection(event));
    this.canvas.on('selection:cleared', () => (this.selectedZoneId = null));
    this.canvas.on('object:added', (event: any) => {
      const target = event?.target;
      if (target?.type === 'polygon' && !target.controls?.p0) {
        this.makePolygonEditable(target);
      }
    });

    if (this.pendingBackgroundUrl) {
      this.setCanvasBackground(this.pendingBackgroundUrl);
      this.pendingBackgroundUrl = null;
    } else if (this.customSurface?.imageDataUrl) {
      this.setCanvasBackground(this.customSurface.imageDataUrl);
    }

    if (this.pendingZones) {
      this.applyZones(this.pendingZones);
      this.pendingZones = null;
    } else if (this.customSurface?.zones?.length) {
      this.applyZones(this.customSurface.zones);
    }

    this.backgroundName = this.customSurface?.imageName ?? this.backgroundName;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customSurface']) {
      this.handleCustomSurfaceChange(changes['customSurface'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.cancelPolygonCreation();
    this.detachCreationListeners();
    this.canvas?.dispose();
  }

  get isCanvasReady(): boolean {
    return !!this.canvas;
  }

  get canAddZones(): boolean {
    return this.isCanvasReady && !!this.customSurface?.imageDataUrl && !this.isCreatingZone;
  }

  get canFinishZone(): boolean {
    return this.isCreatingZone && this.creationPoints.length >= 3;
  }

  get creationPointsCount(): number {
    return this.creationPoints.length;
  }

  addPolygonZone(): void {
    if (!this.canvas || !this.customSurface?.imageDataUrl) {
      return;
    }

    if (this.isCreatingZone) {
      return;
    }

    this.startPolygonCreation();
  }

  finishPolygonCreation(): void {
    if (!this.canvas || !this.canFinishZone) {
      return;
    }

    const zoneId = `zone-${this.nextZoneIndex++}`;
    const polygonPoints = this.creationPoints.map((point) => ({ ...point }));
    const polygon = new fabric.Polygon(polygonPoints, {
      fill: 'rgba(0, 153, 255, 0.25)',
      stroke: '#0099ff',
      strokeWidth: 2,
      perPixelTargetFind: true,
      objectCaching: false,
      cornerSize: 8,
      transparentCorners: false,
      lockRotation: true,
      lockScalingFlip: true,
      lockScalingX: true,
      lockScalingY: true
    });

    this.finalizePolygon(polygon, zoneId);
  }

  removeSelectedZone(): void {
    if (!this.canvas || !this.selectedZoneId) {
      return;
    }

    const object = this.canvas.getObjects().find((item: any) => item.zoneId === this.selectedZoneId);
    if (object) {
      this.canvas.remove(object);
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
      this.selectedZoneId = null;
      this.syncZonesFromCanvas();
    }
  }

  onZoneLabelChange(zone: CustomSurfaceZone): void {
    if (!this.canvas) {
      return;
    }

    const object = this.canvas.getObjects().find((item: any) => item.zoneId === zone.id);
    if (object) {
      object.set('label', zone.label);
      this.canvas.requestRenderAll();
      this.syncZonesFromCanvas();
    }
  }

  selectZone(zone: CustomSurfaceZone): void {
    if (!this.canvas) {
      return;
    }

    const object = this.canvas.getObjects().find((item: any) => item.zoneId === zone.id);
    if (object) {
      this.canvas.setActiveObject(object);
      this.canvas.requestRenderAll();
      this.selectedZoneId = zone.id;
    }
  }

  private syncZonesFromCanvas(): void {
    if (!this.canvas) {
      return;
    }

    const objects = this.canvas.getObjects().filter((item: any) => item.type === 'polygon');
    const zones: CustomSurfaceZone[] = objects.map((obj: any) => {
      const zoneId = obj.zoneId ?? `zone-${this.nextZoneIndex++}`;
      obj.set('zoneId', zoneId);
      const label = obj.label ?? `Zone ${this.nextZoneIndex - 1}`;
      obj.set('label', label);
      const matrix = obj.calcTransformMatrix();
      const transformedPoints = obj.points.map((point: any) => {
        const pointWithOffset = new fabric.Point(point.x - obj.pathOffset.x, point.y - obj.pathOffset.y);
        const transformed = fabric.util.transformPoint(pointWithOffset, matrix);
        return {
          x: Math.round(transformed.x),
          y: Math.round(transformed.y)
        };
      });
      return {
        id: zoneId,
        label,
        points: transformedPoints,
        fabricState: obj.toObject([
          'zoneId',
          'label',
          'left',
          'top',
          'angle',
          'scaleX',
          'scaleY',
          'originX',
          'originY',
          'points',
          'pathOffset',
          'fill',
          'stroke',
          'strokeWidth',
          'perPixelTargetFind',
          'objectCaching',
          'cornerSize',
          'transparentCorners',
          'lockRotation',
          'lockScalingFlip',
          'lockScalingX',
          'lockScalingY'
        ])
      };
    });

    this.zones = zones;
    if (this.selectedZoneId && !zones.some(zone => zone.id === this.selectedZoneId)) {
      this.selectedZoneId = null;
    }
    this.updateNextZoneIndexFromZones(zones);
    if (this.isRestoringZones) {
      this.isRestoringZones = false;
      return;
    }
    this.emitZonesChange();
  }

  private onSelection(event: any): void {
    const obj = event?.selected?.[0];
    if (obj && obj.zoneId) {
      this.selectedZoneId = obj.zoneId;
    } else {
      this.selectedZoneId = null;
    }
  }

  private makePolygonEditable(polygon: any): void {
    polygon.hasBorders = false;
    polygon.cornerStyle = 'circle';
    polygon.cornerColor = '#0099ff';
    polygon.hasControls = true;
    polygon.hasRotatingPoint = false;
    polygon.objectCaching = false;
    polygon.perPixelTargetFind = true;
    polygon.controls = polygon.points.reduce((controls: Record<string, any>, _point: any, index: number) => {
      controls[`p${index}`] = this.createVertexControl(index);
      return controls;
    }, {});
    polygon.setCoords();
  }

  private createVertexControl(index: number): any {
    return new fabric.Control({
      positionHandler: (_dim: any, _finalMatrix: any, target: any) => {
        const point = target.points[index];
        const localPoint = new fabric.Point(point.x - target.pathOffset.x, point.y - target.pathOffset.y);
        const matrix = target.calcTransformMatrix();
        const viewportTransform = target.canvas?.viewportTransform ?? [1, 0, 0, 1, 0, 0];
        const finalMatrix = fabric.util.multiplyTransformMatrices(viewportTransform, matrix);
        return fabric.util.transformPoint(localPoint, finalMatrix);
      },
      actionHandler: (_eventData: any, transform: any, x: number, y: number) => {
        const poly = transform.target;
        const localPoint = poly.toLocalPoint(new fabric.Point(x, y), 'center', 'center');
        poly.points[index].x = localPoint.x + poly.pathOffset.x;
        poly.points[index].y = localPoint.y + poly.pathOffset.y;
        poly.dirty = true;
        poly.setCoords();
        poly.canvas?.requestRenderAll();
        this.syncZonesFromCanvas();
        return true;
      },
      actionName: 'modifyPolygon',
      cursorStyle: 'pointer',
      render: this.renderVertexControl,
      pointIndex: index
    });
  }

  private readonly renderVertexControl = (
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    _styleOverride: any,
    fabricObject: any
  ): void => {
    const zoom = fabricObject.canvas?.getZoom() ?? 1;
    const size = 10 / zoom;
    ctx.save();
    ctx.translate(left, top);
    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle ?? 0));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2 / zoom;
    const half = size / 2;
    ctx.beginPath();
    ctx.rect(-half, -half, size, size);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  }

  private handleCustomSurfaceChange(customSurface: CustomSurfaceData | null): void {
    this.backgroundName = customSurface?.imageName ?? '';
    if (!this.canvas) {
      this.pendingBackgroundUrl = customSurface?.imageDataUrl ?? null;
      this.pendingZones = customSurface?.zones ?? null;
      return;
    }

    this.cancelPolygonCreation();

    if (!customSurface || !customSurface.imageDataUrl) {
      this.clearCanvas();
      return;
    }

    if (customSurface.imageDataUrl !== this.backgroundUrl) {
      this.setCanvasBackground(customSurface.imageDataUrl);
    }
    this.applyZones(customSurface.zones ?? []);
  }

  private setCanvasBackground(imageUrl: string): void {
    if (!this.canvas) {
      this.pendingBackgroundUrl = imageUrl;
      return;
    }

    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        const width = img.width ?? 800;
        const height = img.height ?? 500;
        this.canvas.setDimensions({ width, height });
        this.canvas.setBackgroundImage(
          img,
          this.canvas.renderAll.bind(this.canvas),
          {
            originX: 'left',
            originY: 'top',
            scaleX: width / (img.width || width),
            scaleY: height / (img.height || height)
          }
        );
        this.backgroundUrl = imageUrl;
      },
      { crossOrigin: 'anonymous' }
    );
  }

  private clearCanvas(): void {
    if (!this.canvas) {
      return;
    }
    this.cancelPolygonCreation();
    this.canvas.setBackgroundImage(undefined, this.canvas.renderAll.bind(this.canvas));
    this.backgroundUrl = null;
    this.zones = [];
    this.pendingZones = null;
    this.selectedZoneId = null;
    const objects = this.canvas.getObjects();
    objects.forEach((obj: any) => this.canvas?.remove(obj));
    this.canvas.renderAll();
    this.emitZonesChange();
  }

  private applyZones(zones: CustomSurfaceZone[]): void {
    if (!this.canvas) {
      this.pendingZones = zones;
      return;
    }

    this.cancelPolygonCreation();
    this.isRestoringZones = true;
    const existingPolygons = this.canvas
      .getObjects()
      .filter((item: any) => item.type === 'polygon');
    existingPolygons.forEach((item: any) => this.canvas?.remove(item));

    zones.forEach((zone) => {
      const fabricState = zone.fabricState ?? {};
      const basePoints = (fabricState as any).points ?? zone.points ?? [];
      const polygon = new fabric.Polygon(basePoints, {
        fill: (fabricState as any).fill ?? 'rgba(0, 153, 255, 0.25)',
        stroke: (fabricState as any).stroke ?? '#0099ff',
        strokeWidth: (fabricState as any).strokeWidth ?? 2,
        perPixelTargetFind: (fabricState as any).perPixelTargetFind ?? true,
        objectCaching: (fabricState as any).objectCaching ?? false,
        cornerSize: (fabricState as any).cornerSize ?? 8,
        transparentCorners: (fabricState as any).transparentCorners ?? false,
        lockRotation: (fabricState as any).lockRotation ?? true,
        lockScalingFlip: (fabricState as any).lockScalingFlip ?? true,
        lockScalingX: (fabricState as any).lockScalingX ?? true,
        lockScalingY: (fabricState as any).lockScalingY ?? true,
        left: (fabricState as any).left ?? 0,
        top: (fabricState as any).top ?? 0,
        angle: (fabricState as any).angle ?? 0,
        scaleX: (fabricState as any).scaleX ?? 1,
        scaleY: (fabricState as any).scaleY ?? 1,
        originX: (fabricState as any).originX ?? 'left',
        originY: (fabricState as any).originY ?? 'top'
      });
      polygon.set('zoneId', zone.id);
      polygon.set('label', zone.label);
      if ((fabricState as any).pathOffset) {
        polygon.pathOffset = new fabric.Point(
          (fabricState as any).pathOffset.x ?? polygon.pathOffset.x,
          (fabricState as any).pathOffset.y ?? polygon.pathOffset.y
        );
      }
      this.makePolygonEditable(polygon);
      this.canvas?.add(polygon);
    });

    this.canvas.requestRenderAll();
    this.zones = zones;
    this.updateNextZoneIndexFromZones(zones);
    this.syncZonesFromCanvas();
  }

  private emitZonesChange(): void {
    this.zonesChange.emit(
      this.zones.map((zone) => ({
        ...zone,
        fabricState: JSON.parse(JSON.stringify(zone.fabricState ?? {}))
      }))
    );
  }

  private updateNextZoneIndexFromZones(zones: CustomSurfaceZone[]): void {
    const indices = zones
      .map((zone) => {
        const match = zone.id.match(/(\d+)$/);
        return match ? Number(match[1]) : NaN;
      })
      .filter((value) => !Number.isNaN(value));
    if (indices.length) {
      this.nextZoneIndex = Math.max(...indices) + 1;
    } else if (zones.length === 0) {
      this.nextZoneIndex = 1;
    }
  }

  cancelPolygonCreation(): void {
    if (!this.isCreatingZone) {
      return;
    }
    this.detachCreationListeners();
    this.clearCreationArtifacts();
    this.creationPoints = [];
    this.creationPreviewPoint = null;
    this.isCreatingZone = false;
    this.restoreCanvasInteraction();
    this.canvas?.requestRenderAll();
  }

  private startPolygonCreation(): void {
    if (!this.canvas) {
      return;
    }

    this.isCreatingZone = true;
    this.creationPoints = [];
    this.creationPreviewPoint = null;
    this.clearCreationArtifacts();
    this.canvas.discardActiveObject();
    this.selectedZoneId = null;
    this.canvas.requestRenderAll();
    this.canvas.selection = false;
    this.canvas.defaultCursor = 'crosshair';
    this.togglePolygonSelectability(false);
    this.canvas.on('mouse:down', this.canvasClickHandler);
    this.canvas.on('mouse:move', this.canvasMoveHandler);
    this.canvas.on('mouse:dblclick', this.canvasDoubleClickHandler);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keyDownHandler);
    }
  }

  private finalizePolygon(polygon: any, zoneId: string): void {
    if (!this.canvas) {
      return;
    }

    polygon.set('zoneId', zoneId);
    polygon.set('label', `Zone ${this.nextZoneIndex - 1}`);

    this.makePolygonEditable(polygon);

    this.canvas.add(polygon);
    this.canvas.setActiveObject(polygon);

    this.detachCreationListeners();
    this.clearCreationArtifacts();
    this.creationPoints = [];
    this.creationPreviewPoint = null;
    this.isCreatingZone = false;
    this.restoreCanvasInteraction();

    this.canvas.requestRenderAll();
    this.selectedZoneId = zoneId;
    this.syncZonesFromCanvas();
  }

  private handleCanvasClick(event: any): void {
    if (!this.canvas || !this.isCreatingZone) {
      return;
    }

    const pointer = this.canvas.getPointer(event.e);
    const point = {
      x: Math.round(pointer.x),
      y: Math.round(pointer.y)
    };

    if (this.isPointerNearFirstPoint(point) && this.canFinishZone) {
      event?.e?.preventDefault?.();
      event?.e?.stopPropagation?.();
      this.finishPolygonCreation();
      return;
    }

    this.creationPoints.push(point);
    this.addCreationMarker(point);
    this.updateCreationShape();
  }

  private handleCanvasMove(event: any): void {
    if (!this.canvas || !this.isCreatingZone || !this.creationPoints.length) {
      return;
    }

    const pointer = this.canvas.getPointer(event.e);
    const previewPoint = {
      x: Math.round(pointer.x),
      y: Math.round(pointer.y)
    };

    if (this.isPointerNearFirstPoint(previewPoint) && this.canFinishZone) {
      this.creationPreviewPoint = { ...this.creationPoints[0] };
      this.canvas.defaultCursor = 'pointer';
    } else {
      this.creationPreviewPoint = previewPoint;
      this.canvas.defaultCursor = 'crosshair';
    }
    this.updateCreationShape();
  }

  private updateCreationShape(): void {
    if (!this.canvas) {
      return;
    }

    const points = [...this.creationPoints];
    if (this.creationPreviewPoint) {
      points.push(this.creationPreviewPoint);
    }

    if (points.length < 2) {
      if (this.creationPolyline) {
        this.canvas.remove(this.creationPolyline);
        this.creationPolyline = undefined;
      }
      this.canvas.requestRenderAll();
      return;
    }

    if (!this.creationPolyline) {
      this.creationPolyline = new fabric.Polyline(points, {
        fill: 'rgba(37, 99, 235, 0.12)',
        stroke: '#2563eb',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        objectCaching: false
      });
      this.canvas.add(this.creationPolyline);
      this.creationPolyline.moveTo(0);
    } else {
      this.creationPolyline.set({ points });
    }

    this.canvas.requestRenderAll();
  }

  private addCreationMarker(point: { x: number; y: number }): void {
    if (!this.canvas) {
      return;
    }

    const marker = new fabric.Circle({
      radius: 5,
      fill: '#2563eb',
      stroke: '#ffffff',
      strokeWidth: 2,
      left: point.x,
      top: point.y,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });

    if (this.creationPoints.length === 1) {
      marker.set({
        radius: 6,
        fill: '#ffffff',
        stroke: '#2563eb',
        strokeWidth: 2.5
      });
      this.creationStartMarker = marker;
    }

    this.creationPointMarkers.push(marker);
    this.canvas.add(marker);
    marker.moveTo(this.canvas.getObjects().length - 1);
    this.canvas.requestRenderAll();
  }

  private clearCreationArtifacts(): void {
    if (!this.canvas) {
      return;
    }

    if (this.creationPolyline) {
      this.canvas.remove(this.creationPolyline);
      this.creationPolyline = undefined;
    }

    if (this.creationPointMarkers.length) {
      this.creationPointMarkers.forEach((marker) => this.canvas?.remove(marker));
      this.creationPointMarkers = [];
    }

    if (this.creationStartMarker) {
      if (this.creationStartMarker.canvas) {
        this.canvas.remove(this.creationStartMarker);
      }
      this.creationStartMarker = undefined;
    }
  }

  private detachCreationListeners(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.off('mouse:down', this.canvasClickHandler);
    this.canvas.off('mouse:move', this.canvasMoveHandler);
    this.canvas.off('mouse:dblclick', this.canvasDoubleClickHandler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
  }

  private restoreCanvasInteraction(): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.selection = true;
    this.canvas.defaultCursor = 'default';
    this.togglePolygonSelectability(true);
  }

  private togglePolygonSelectability(enabled: boolean): void {
    if (!this.canvas) {
      return;
    }

    this.canvas.getObjects().forEach((obj: any) => {
      if (obj.type === 'polygon') {
        obj.selectable = enabled;
        obj.evented = enabled;
      }
    });
  }

  removeLastCreationPoint(): void {
    if (!this.canvas || !this.isCreatingZone || !this.creationPoints.length) {
      return;
    }

    this.creationPoints.pop();
    const marker = this.creationPointMarkers.pop();
    if (marker) {
      this.canvas.remove(marker);
      if (marker === this.creationStartMarker) {
        this.creationStartMarker = undefined;
      }
    }

    if (!this.creationPoints.length && this.creationStartMarker) {
      this.canvas.remove(this.creationStartMarker);
      this.creationStartMarker = undefined;
    }

    this.creationPreviewPoint = null;
    this.updateCreationShape();
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.requestRenderAll();
  }

  private handleCanvasDoubleClick(event: any): void {
    if (!this.canvas || !this.isCreatingZone) {
      return;
    }

    event?.e?.preventDefault?.();
    event?.e?.stopPropagation?.();

    if (this.creationPoints.length >= 2) {
      const lastIndex = this.creationPoints.length - 1;
      const lastPoint = this.creationPoints[lastIndex];
      const previousPoint = this.creationPoints[lastIndex - 1];
      if (lastPoint && previousPoint) {
        const distance = Math.hypot(lastPoint.x - previousPoint.x, lastPoint.y - previousPoint.y);
        if (distance <= 2) {
          this.creationPoints.pop();
          const marker = this.creationPointMarkers.pop();
          if (marker) {
            this.canvas.remove(marker);
            if (marker === this.creationStartMarker) {
              this.creationStartMarker = undefined;
            }
          }
          this.creationPreviewPoint = null;
        }
      }
    }

    if (this.canFinishZone) {
      this.finishPolygonCreation();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isCreatingZone) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelPolygonCreation();
      return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && this.creationPoints.length) {
      event.preventDefault();
      this.removeLastCreationPoint();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && this.canFinishZone) {
      event.preventDefault();
      this.finishPolygonCreation();
    }
  }

  private isPointerNearFirstPoint(point: { x: number; y: number }): boolean {
    if (!this.creationPoints.length) {
      return false;
    }

    const firstPoint = this.creationPoints[0];
    const distance = Math.hypot(point.x - firstPoint.x, point.y - firstPoint.y);
    return distance <= 12;
  }
}
