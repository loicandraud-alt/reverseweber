import { Component, Input } from '@angular/core';
import { Surface } from '../../data/surfaces';
import { Colour } from '../../data/palettes';

@Component({
  selector: 'app-surface-legend',
  templateUrl: './surface-legend.component.html',
  styleUrls: ['./surface-legend.component.css']
})
export class SurfaceLegendComponent {
  @Input({ required: true }) surface!: Surface;
  @Input({ required: true }) selectedColours: Record<string, Colour> = {};
}
