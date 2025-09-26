import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { COLOUR_FAMILIES, Colour, ColourFamily } from '../data/palettes';
import { SURFACES, Surface } from '../data/surfaces';

export interface ProjectState {
  surface: Surface;
  selectedColours: Record<string, Colour>;
  favouriteColours: string[];
}

const DEFAULT_SURFACE = SURFACES[0];
const DEFAULT_COLOUR = COLOUR_FAMILIES[0].colours[0];
const buildInitialPalette = (surface: Surface): Record<string, Colour> => {
  return surface.zones.reduce<Record<string, Colour>>((acc, zone) => {
    acc[zone.id] = DEFAULT_COLOUR;
    return acc;
  }, {});
};

@Injectable({ providedIn: 'root' })
export class ProjectStateService {
  private readonly surface$ = new BehaviorSubject<Surface>(DEFAULT_SURFACE);
  private readonly selectedColours$ = new BehaviorSubject<Record<string, Colour>>(
    buildInitialPalette(DEFAULT_SURFACE)
  );
  private readonly favourites$ = new BehaviorSubject<string[]>([]);

  readonly viewModel$ = combineLatest([
    this.surface$,
    this.selectedColours$,
    this.favourites$
  ]).pipe(
    map(([surface, selectedColours, favourites]) => ({
      surface,
      selectedColours,
      favourites,
      surfaceZones: surface.zones,
      palette: COLOUR_FAMILIES,
      surfaces: SURFACES
    }))
  );

  selectSurface(surfaceId: string): void {
    const surface = SURFACES.find((item) => item.id === surfaceId);
    if (!surface) {
      return;
    }
    this.surface$.next(surface);
    const currentColours = { ...buildInitialPalette(surface), ...this.selectedColours$.value };
    this.selectedColours$.next(currentColours);
  }

  applyColour(zoneId: string, colour: Colour): void {
    const nextColours = { ...this.selectedColours$.value, [zoneId]: colour };
    this.selectedColours$.next(nextColours);
  }

  toggleFavourite(colourId: string): void {
    const favourites = new Set(this.favourites$.value);
    if (favourites.has(colourId)) {
      favourites.delete(colourId);
    } else {
      favourites.add(colourId);
    }
    this.favourites$.next(Array.from(favourites));
  }

  isFavourite(colourId: string): boolean {
    return this.favourites$.value.includes(colourId);
  }

  getColourFamilies(): ColourFamily[] {
    return COLOUR_FAMILIES;
  }
}
