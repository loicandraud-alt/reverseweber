import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.css']
})
export class IntroComponent {
  readonly steps = [
    {
      title: 'Choisissez une ambiance',
      description:
        'Sélectionnez un univers qui ressemble à votre projet : façade, intérieur ou décoration de détail.'
    },
    {
      title: 'Expérimentez les couleurs',
      description:
        'Composez votre palette grâce à nos familles chromatiques et visualisez-la instantanément sur le décor.'
    },
    {
      title: 'Partagez votre inspiration',
      description:
        'Enregistrez vos simulations, téléchargez-les en PDF et partagez-les avec vos clients ou collaborateurs.'
    }
  ];

  constructor(private readonly router: Router) {}

  startSimulation(): void {
    this.router.navigate(['/simulator']);
  }
}
