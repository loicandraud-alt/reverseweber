import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Colour } from '../../data/palettes';

@Component({
  selector: 'app-colour-card',
  templateUrl: './colour-card.component.html',
  styleUrls: ['./colour-card.component.css']
})
export class ColourCardComponent {
  @Input({ required: true }) colour!: Colour;
  @Input() selected = false;
  @Input() favourite = false;
  @Output() readonly apply = new EventEmitter<void>();
  @Output() readonly toggleFavourite = new EventEmitter<void>();
}
