import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProjectStateService, CustomSurfaceZone } from '../../services/project-state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulatorComponent {
  readonly vm$ = this.projectState.viewModel$;

  constructor(private readonly projectState: ProjectStateService) {}

  onSurfaceChange(surfaceId: string): void {
    this.projectState.selectSurface(surfaceId);
  }

  onImageUpload(file: File | null): void {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.projectState.useCustomSurface(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  onCustomSurfaceZonesChange(zones: CustomSurfaceZone[]): void {
    this.projectState.updateCustomSurfaceZones(zones);
  }
}
