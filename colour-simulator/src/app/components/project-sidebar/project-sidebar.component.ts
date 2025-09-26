import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Surface } from '../../data/surfaces';
import { Colour } from '../../data/palettes';
import { CustomSurfaceData } from '../../services/project-state.service';

@Component({
  selector: 'app-project-sidebar',
  templateUrl: './project-sidebar.component.html',
  styleUrls: ['./project-sidebar.component.css']
})
export class ProjectSidebarComponent {
  @Input({ required: true }) surface!: Surface;
  @Input({ required: true }) selectedColours: Record<string, Colour> = {};
  @Input() customSurface: CustomSurfaceData | null = null;
  @Output() readonly imageUpload = new EventEmitter<File>();

  get uploadedImageUrl(): string | null {
    return this.customSurface?.imageDataUrl ?? null;
  }

  get uploadedImageName(): string {
    return this.customSurface?.imageName ?? 'Image importée';
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
