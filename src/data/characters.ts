export type CharacterId = 'random' | 'kaptan' | 'kedi' | 'krizi' | 'golge';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  color: number; // yer tutucu şekil rengi (Phaser hex)
  role: 'hero' | 'friend' | 'rival';
  hat?: 'captain';
  hasSunPendant?: boolean;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  random: { id: 'random', name: 'Random Köpek', color: 0x43c743, role: 'hero' },
  kaptan: { id: 'kaptan', name: 'Kaptan Random', color: 0x2f9e2f, role: 'friend', hat: 'captain' },
  kedi: { id: 'kedi', name: 'Random Kedi', color: 0xf2d43f, role: 'friend' },
  krizi: { id: 'krizi', name: 'Random Krizi', color: 0xd98cff, role: 'friend', hasSunPendant: true },
  golge: { id: 'golge', name: 'Gölge Random', color: 0x565663, role: 'rival' },
};
