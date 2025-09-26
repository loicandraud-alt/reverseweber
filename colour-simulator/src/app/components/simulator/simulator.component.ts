import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProjectStateService } from '../../services/project-state.service';
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
}
