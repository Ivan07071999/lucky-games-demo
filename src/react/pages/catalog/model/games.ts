export type Game = {
  id: string;
  number: string;
  translationKey: 'moonGarden' | 'goldenTemple';
  palette: 'violet' | 'amber';
  image?: string;
  path?: string;
};

export const games: Game[] = [
  { id: 'moon-garden', number: '01', translationKey: 'moonGarden', palette: 'violet' },
  {
    id: 'golden-temple',
    number: '02',
    translationKey: 'goldenTemple',
    palette: 'amber',
    image: '/egypt-assets/PNG/logo/slot_logo.jpg',
    path: '/games/egypt-slot',
  },
];
