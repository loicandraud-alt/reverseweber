import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { COLOUR_FAMILIES, Colour, ColourFamily } from '../data/palettes';
import { SURFACES, Surface } from '../data/surfaces';

export interface CustomSurfacePoint {
  x: number;
  y: number;
}

export interface CustomSurfaceZone {
  id: string;
  label: string;
  points: CustomSurfacePoint[];
  fabricState: Record<string, unknown>;
}

export interface CustomSurfaceData {
  imageDataUrl: string;
  imageName?: string;
  zones: CustomSurfaceZone[];
}

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
  private readonly surfaces$ = new BehaviorSubject<Surface[]>(SURFACES);
  private readonly customSurfaceData$ = new BehaviorSubject<CustomSurfaceData | null>(null);

  readonly viewModel$ = combineLatest([
    this.surface$,
    this.selectedColours$,
    this.favourites$,
    this.surfaces$,
    this.customSurfaceData$
  ]).pipe(
    map(([surface, selectedColours, favourites, surfaces, customSurface]) => ({
      surface,
      selectedColours,
      favourites,
      surfaceZones: surface.zones,
      palette: COLOUR_FAMILIES,
      surfaces,
      customSurface
    }))
  );

  selectSurface(surfaceId: string): void {
    const surface = this.surfaces$.value.find((item) => item.id === surfaceId);
    if (!surface) {
      return;
    }
    this.surface$.next(surface);
    if (surface.id !== 'custom-surface') {
      this.customSurfaceData$.next(null);
    }
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

  useCustomSurface(previewDataUrl: string, name?: string): void {
    if (!previewDataUrl) {
      return;
    }

    const baseSurface = this.surface$.value ?? DEFAULT_SURFACE;
    const customSurface: Surface = {
      ...baseSurface,
      id: 'custom-surface',
      name: name ? `Image importée – ${name}` : 'Image importée',
      category: 'decor',
      preview: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.35)), url(${previewDataUrl})`,
      accentColour: '#f7931e'
    };

    this.surfaces$.next([customSurface]);
    this.surface$.next(customSurface);
    const updatedPalette = buildInitialPalette(customSurface);
    this.selectedColours$.next({ ...updatedPalette, ...this.selectedColours$.value });
    this.customSurfaceData$.next({
      imageDataUrl: previewDataUrl,
      imageName: name,
      zones: []
    });
  }

  updateCustomSurfaceZones(zones: CustomSurfaceZone[]): void {
    const customSurface = this.customSurfaceData$.value;
    if (!customSurface) {
      return;
    }

    const nextData: CustomSurfaceData = {
      ...customSurface,
      zones
    };
    this.customSurfaceData$.next(nextData);

    const surface = this.surface$.value;
    if (!surface || surface.id !== 'custom-surface') {
      return;
    }

    const cssVariables = ['--zone-main', '--zone-secondary', '--zone-details'];
    const zoneDefinitions = zones.map((zone, index) => ({
      id: zone.id,
      label: zone.label,
      description: `Zone personnalisée ${index + 1}`,
      cssVariable: cssVariables[index] ?? `--zone-custom-${index + 1}`
    }));
    const updatedSurface: Surface = {
      ...surface,
      zones: zoneDefinitions
    };
    this.surface$.next(updatedSurface);
    const updatedPalette = buildInitialPalette(updatedSurface);
    const preservedColours = zones.reduce<Record<string, Colour>>((acc, zone) => {
      const existing = this.selectedColours$.value[zone.id];
      if (existing) {
        acc[zone.id] = existing;
      }
      return acc;
    }, {});
    this.selectedColours$.next({ ...updatedPalette, ...preservedColours });
  }
}
