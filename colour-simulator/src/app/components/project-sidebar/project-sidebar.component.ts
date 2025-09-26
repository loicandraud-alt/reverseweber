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
  @Output() readonly imageUpload = new EventEmitter<File>();

  get categories(): { id: Surface['category']; label: string }[] {
    const base: { id: Surface['category']; label: string }[] = [
      { id: 'exterieur', label: 'Extérieur' },
      { id: 'interieur', label: 'Intérieur' },
      { id: 'decor', label: 'Décor' }
    ];
    if (!this.surfaces?.length) {
      return base;
    }
    const available = base.filter((category) =>
      this.surfaces.some((surface) => surface.category === category.id)
    );
    return available.length ? available : base;
  }

  surfacesByCategory(category: Surface['category']): Surface[] {
    return this.surfaces.filter((item) => item.category === category);
  }

  trackBySurface(_: number, surface: Surface): string {
    return surface.id;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) {
      this.imageUpload.emit(file);
      input.value = '';
    }
  }
}
