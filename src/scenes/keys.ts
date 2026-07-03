export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Pause: 'Pause',
  GameOver: 'GameOver',
  ChapterIntro: 'ChapterIntro',
  Cutscene: 'Chapter1_Cutscene',
  Halay: 'Chapter1_Halay',
  KeyGrab: 'Chapter1_KeyGrab',
  Escape: 'Chapter1_Escape',
  Battle: 'Chapter1_Battle',
  Chapter2_Forest: 'Chapter2_Forest',
  Chapter2_Park: 'Chapter2_Park',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
