import { Component, Input, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { Surface } from '../../data/surfaces';
import { Colour } from '../../data/palettes';

@Component({
  selector: 'app-surface-viewer',
  templateUrl: './surface-viewer.component.html',
  styleUrls: ['./surface-viewer.component.css']
})
export class SurfaceViewerComponent implements OnChanges {
  @Input({ required: true }) surface!: Surface;
  @Input({ required: true }) selectedColours: Record<string, Colour> = {};

  @HostBinding('style.--zone-main') zoneMain = '#d9dde1';
  @HostBinding('style.--zone-secondary') zoneSecondary = '#c5cad0';
  @HostBinding('style.--zone-details') zoneDetails = '#a3aab3';

  ngOnChanges(_: SimpleChanges): void {
    if (!this.surface) {
      return;
    }
    for (const zone of this.surface.zones) {
      const value = this.selectedColours[zone.id]?.hex;
      if (!value) {
        continue;
      }
      switch (zone.cssVariable) {
        case '--zone-main':
          this.zoneMain = value;
          break;
        case '--zone-secondary':
          this.zoneSecondary = value;
          break;
        case '--zone-details':
          this.zoneDetails = value;
          break;
        default:
          (this as any)[zone.cssVariable] = value;
          break;
      }
    }
  }
}
