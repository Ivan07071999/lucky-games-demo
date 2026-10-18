export type Game = {
  id: string
  number: string
  translationKey: 'moonGarden' | 'goldenTemple'
  palette: 'violet' | 'amber'
  path?: string
}

export const games: Game[] = [
  { id: 'moon-garden', number: '01', translationKey: 'moonGarden', palette: 'violet' },
  {
    id: 'golden-temple',
    number: '02',
    translationKey: 'goldenTemple',
    palette: 'amber',
    path: '/games/egypt-slot',
  },
]
