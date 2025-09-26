import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

declare const fabric: any;

interface SurfacePoint {
  x: number;
  y: number;
}

interface SurfaceZone {
  id: string;
  label: string;
  points: SurfacePoint[];
}

@Component({
  selector: 'app-surface-editor',
  templateUrl: './surface-editor.component.html',
  styleUrls: ['./surface-editor.component.css']
})
export class SurfaceEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  zones: SurfaceZone[] = [];
  private canvas?: any;
  private nextZoneIndex = 1;
  selectedZoneId: string | null = null;
  backgroundName = '';
  fabricUnavailable = false;

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
  }

  ngOnDestroy(): void {
    this.canvas?.dispose();
  }

  get isCanvasReady(): boolean {
    return !!this.canvas;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.backgroundName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      fabric.Image.fromURL(dataUrl, (img: any) => {
        const width = img.width ?? 800;
        const height = img.height ?? 500;
        this.canvas.setDimensions({ width, height });
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
          scaleX: width / (img.width || width),
          scaleY: height / (img.height || height)
        });
      }, { crossOrigin: 'anonymous' });
    };
    reader.readAsDataURL(file);
  }

  addPolygonZone(): void {
    if (!this.canvas) {
      return;
    }

    const zoneId = `zone-${this.nextZoneIndex++}`;
    const points = [
      { x: 100, y: 100 },
      { x: 260, y: 100 },
      { x: 260, y: 200 },
      { x: 100, y: 200 }
    ];

    const polygon = new fabric.Polygon(points, {
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

    polygon.set('zoneId', zoneId);
    polygon.set('label', `Zone ${this.nextZoneIndex - 1}`);

    this.makePolygonEditable(polygon);

    this.canvas.add(polygon);
    this.canvas.setActiveObject(polygon);
    this.canvas.renderAll();
    this.syncZonesFromCanvas();
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

  onZoneLabelChange(zone: SurfaceZone): void {
    if (!this.canvas) {
      return;
    }

    const object = this.canvas.getObjects().find((item: any) => item.zoneId === zone.id);
    if (object) {
      object.set('label', zone.label);
      this.canvas.requestRenderAll();
    }
  }

  selectZone(zone: SurfaceZone): void {
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
    const zones: SurfaceZone[] = objects.map((obj: any) => {
      const zoneId = obj.zoneId ?? `zone-${this.nextZoneIndex++}`;
      obj.set('zoneId', zoneId);
      const label = obj.label ?? `Zone ${this.nextZoneIndex - 1}`;
      obj.set('label', label);
      const matrix = obj.calcTransformMatrix();
      const transformedPoints: SurfacePoint[] = obj.points.map((point: any) => {
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
        points: transformedPoints
      };
    });

    this.zones = zones;
    if (this.selectedZoneId && !zones.some(zone => zone.id === this.selectedZoneId)) {
      this.selectedZoneId = null;
    }
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
    polygon.controls = polygon.points.reduce((controls: Record<string, any>, _point: any, index: number) => {
      controls[`p${index}`] = new fabric.Control({
        positionHandler: (_dim: any, _finalMatrix: any, target: any) => {
          const point = target.points[index];
          const matrix = target.calcTransformMatrix();
          const transformed = fabric.util.transformPoint(
            new fabric.Point(point.x - target.pathOffset.x, point.y - target.pathOffset.y),
            matrix
          );
          return transformed;
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
        cursorStyle: 'pointer'
      });
      return controls;
    }, {});
  }
}
