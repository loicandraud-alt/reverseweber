import { Routes } from '@angular/router';
import { IntroComponent } from './components/intro/intro.component';
import { SimulatorComponent } from './components/simulator/simulator.component';

export const routes: Routes = [
  { path: 'intro', component: IntroComponent },
  { path: 'simulator', component: SimulatorComponent },
  { path: '', pathMatch: 'full', redirectTo: 'intro' },
  { path: '**', redirectTo: 'intro' }
];
