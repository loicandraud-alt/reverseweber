export interface SurfaceZone {
  id: string;
  label: string;
  description: string;
  cssVariable: string;
}

export interface Surface {
  id: string;
  name: string;
  category: 'exterieur' | 'interieur' | 'decor';
  preview: string;
  accentColour: string;
  zones: SurfaceZone[];
}

export const SURFACES: Surface[] = [
  {
    id: 'modern-facade',
    name: 'Façade contemporaine',
    category: 'exterieur',
    preview:
      'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(230,234,238,0.95)), url(https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1400&q=80)',
    accentColour: '#223240',
    zones: [
      { id: 'main', label: 'Enduit principal', description: 'Surface majoritaire de la façade', cssVariable: '--zone-main' },
      { id: 'secondary', label: 'Encadrements', description: 'Tableaux et encadrements de fenêtres', cssVariable: '--zone-secondary' },
      { id: 'details', label: 'Détails architecturaux', description: 'Garde-corps, corniches, etc.', cssVariable: '--zone-details' }
    ]
  },
  {
    id: 'living-room',
    name: 'Salon lumineux',
    category: 'interieur',
    preview:
      'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,240,0.95)), url(https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=80)',
    accentColour: '#7b5cd6',
    zones: [
      { id: 'walls', label: 'Murs', description: 'Murs principaux de la pièce', cssVariable: '--zone-main' },
      { id: 'accent', label: 'Mur d’accent', description: 'Idéal pour une touche audacieuse', cssVariable: '--zone-secondary' },
      { id: 'woodwork', label: 'Boiseries', description: 'Portes, moulures et plinthes', cssVariable: '--zone-details' }
    ]
  },
  {
    id: 'kitchen',
    name: 'Cuisine créative',
    category: 'decor',
    preview:
      'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,248,248,0.9)), url(https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80)',
    accentColour: '#f25c05',
    zones: [
      { id: 'cabinets', label: 'Meubles bas', description: 'Façades de meubles et îlots', cssVariable: '--zone-main' },
      { id: 'high-cabinets', label: 'Meubles hauts', description: 'Colonnes, rangements et étagères', cssVariable: '--zone-secondary' },
      { id: 'backsplash', label: 'Crédence', description: 'Zone stratégique au-dessus du plan de travail', cssVariable: '--zone-details' }
    ]
  }
];
