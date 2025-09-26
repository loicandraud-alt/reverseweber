import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
import { Colour, ColourFamily } from '../../data/palettes';
import { Surface } from '../../data/surfaces';

@Component({
  selector: 'app-palette-panel',
  templateUrl: './palette-panel.component.html',
  styleUrls: ['./palette-panel.component.css']
})
export class PalettePanelComponent implements OnChanges {
  @Input({ required: true }) surface!: Surface;
  @Input({ required: true }) selectedColours: Record<string, Colour> = {};
  activeZoneId: string | null = null;

  constructor(private readonly projectState: ProjectStateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['surface'] && this.surface) {
      const defaultZone = this.surface.zones[0]?.id ?? null;
      if (!this.activeZoneId || !this.surface.zones.some((zone) => zone.id === this.activeZoneId)) {
        this.activeZoneId = defaultZone;
      }
    }
  }

  get families(): ColourFamily[] {
    return this.projectState.getColourFamilies();
  }

  setActiveZone(zoneId: string): void {
    this.activeZoneId = zoneId;
  }

  applyColour(colour: Colour, zoneId: string): void {
    this.projectState.applyColour(zoneId, colour);
  }

  toggleFavourite(colour: Colour): void {
    this.projectState.toggleFavourite(colour.id);
  }

  isFavourite(colour: Colour): boolean {
    return this.projectState.isFavourite(colour.id);
  }

  isZoneActive(zoneId: string): boolean {
    const current = this.activeZoneId ?? this.surface.zones[0]?.id ?? null;
    if (current !== this.activeZoneId) {
      this.activeZoneId = current;
    }
    return current === zoneId;
  }
}
