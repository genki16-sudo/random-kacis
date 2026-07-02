export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Pause: 'Pause',
  GameOver: 'GameOver',
  Cutscene: 'Chapter1_Cutscene',
  Halay: 'Chapter1_Halay',
  KeyGrab: 'Chapter1_KeyGrab',
  Escape: 'Chapter1_Escape',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
