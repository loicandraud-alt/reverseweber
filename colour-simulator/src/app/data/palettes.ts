export interface Colour {
  id: string;
  name: string;
  code: string;
  hex: string;
  family: string;
  description: string;
}

export interface ColourFamily {
  id: string;
  title: string;
  description: string;
  colours: Colour[];
}

export const COLOUR_FAMILIES: ColourFamily[] = [
  {
    id: 'minerals',
    title: 'Minéraux & naturels',
    description: 'Des teintes intemporelles inspirées des pierres et sables européens.',
    colours: [
      { id: 'sand-001', name: 'Sable signature', code: 'WB-201', hex: '#e3d2b4', family: 'minerals', description: 'Un beige doux qui illumine les façades.' },
      { id: 'stone-002', name: 'Granit froid', code: 'WB-325', hex: '#c6cdd3', family: 'minerals', description: 'Idéal pour moderniser une architecture contemporaine.' },
      { id: 'clay-003', name: 'Terre du Sud', code: 'WB-176', hex: '#b69374', family: 'minerals', description: 'Une touche chaleureuse à marier avec un gris profond.' },
      { id: 'chalk-004', name: 'Craie lumineuse', code: 'WB-010', hex: '#f3efe6', family: 'minerals', description: 'Parfaite en tonalité principale pour garder de la luminosité.' }
    ]
  },
  {
    id: 'botanic',
    title: 'Botanique vivante',
    description: 'Des verts vibrants inspirés de la végétation méditerranéenne.',
    colours: [
      { id: 'olive-101', name: 'Olive douce', code: 'WB-452', hex: '#8a9c67', family: 'botanic', description: 'Tendance pour souligner des éléments secondaires.' },
      { id: 'forest-102', name: 'Forêt profonde', code: 'WB-498', hex: '#31543b', family: 'botanic', description: 'Un vert intense idéal pour les détails métalliques.' },
      { id: 'mint-103', name: 'Menthe givrée', code: 'WB-431', hex: '#c8e1c1', family: 'botanic', description: 'Apporte fraîcheur dans une cuisine ou une salle de bain.' },
      { id: 'sage-104', name: 'Sauge artisanale', code: 'WB-467', hex: '#9da88d', family: 'botanic', description: 'S’harmonise parfaitement avec des matériaux bruts.' }
    ]
  },
  {
    id: 'bolds',
    title: 'Contrastes audacieux',
    description: 'Des accents puissants pour mettre en scène les détails architecturaux.',
    colours: [
      { id: 'sunset-201', name: 'Coucher de soleil', code: 'WB-612', hex: '#f77f42', family: 'bolds', description: 'Boostez une façade ensoleillée avec cette teinte vitaminée.' },
      { id: 'berry-202', name: 'Framboise givrée', code: 'WB-634', hex: '#bd4866', family: 'bolds', description: 'Idéale pour un mur d’accent dans un séjour design.' },
      { id: 'marine-203', name: 'Bleu marine', code: 'WB-689', hex: '#203a57', family: 'bolds', description: 'Sublime les huisseries et garde-corps en métal.' },
      { id: 'amber-204', name: 'Ambre précieux', code: 'WB-601', hex: '#f2b441', family: 'bolds', description: 'À associer avec un beige minéral pour un contraste élégant.' }
    ]
  }
];
