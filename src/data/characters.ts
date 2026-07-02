export type CharacterId = 'random' | 'kaptan' | 'kedi' | 'krizi' | 'golge';

export type Species = 'dog' | 'cat' | 'toy';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  color: number; // ana gövde rengi (Phaser hex)
  species: Species;
  role: 'hero' | 'friend' | 'rival';
  hat?: 'captain';
  hasSunPendant?: boolean;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  random: { id: 'random', name: 'Random Köpek', color: 0x43c743, species: 'dog', role: 'hero' },
  kaptan: { id: 'kaptan', name: 'Kaptan Random', color: 0x2f9e2f, species: 'dog', role: 'friend', hat: 'captain' },
  kedi: { id: 'kedi', name: 'Random Kedi', color: 0xf2d43f, species: 'cat', role: 'friend' },
  krizi: { id: 'krizi', name: 'Random Krizi', color: 0xd98cff, species: 'toy', role: 'friend', hasSunPendant: true },
  golge: { id: 'golge', name: 'Gölge Random', color: 0x565663, species: 'dog', role: 'rival' },
};
