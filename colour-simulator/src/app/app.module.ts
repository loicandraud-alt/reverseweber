import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { IntroComponent } from './components/intro/intro.component';
import { SimulatorComponent } from './components/simulator/simulator.component';
import { ProjectSidebarComponent } from './components/project-sidebar/project-sidebar.component';
import { PalettePanelComponent } from './components/palette-panel/palette-panel.component';
import { SurfaceViewerComponent } from './components/surface-viewer/surface-viewer.component';
import { RouterModule } from '@angular/router';
import { ColourCardComponent } from './components/colour-card/colour-card.component';
import { SurfaceLegendComponent } from './components/surface-legend/surface-legend.component';

@NgModule({
  declarations: [
    AppComponent,
    IntroComponent,
    SimulatorComponent,
    ProjectSidebarComponent,
    PalettePanelComponent,
    SurfaceViewerComponent,
    ColourCardComponent,
    SurfaceLegendComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
