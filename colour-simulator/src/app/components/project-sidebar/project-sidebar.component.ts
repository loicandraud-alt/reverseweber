import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Surface, SurfaceZone } from '../../data/surfaces';
import { Colour } from '../../data/palettes';

@Component({
  selector: 'app-project-sidebar',
  templateUrl: './project-sidebar.component.html',
  styleUrls: ['./project-sidebar.component.css']
})
export class ProjectSidebarComponent {
  @Input({ required: true }) surface!: Surface;
  @Input({ required: true }) surfaces: Surface[] = [];
  @Input({ required: true }) selectedColours: Record<string, Colour> = {};
  @Output() readonly surfaceChange = new EventEmitter<string>();

  get categories(): { id: Surface['category']; label: string }[] {
    return [
      { id: 'exterieur', label: 'Extérieur' },
      { id: 'interieur', label: 'Intérieur' },
      { id: 'decor', label: 'Décor' }
    ];
  }

  surfacesByCategory(category: Surface['category']): Surface[] {
    return this.surfaces.filter((item) => item.category === category);
  }

  trackBySurface(_: number, surface: Surface): string {
    return surface.id;
  }
}
