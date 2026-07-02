export interface SaveData {
  chapter: number;
  scene: string;
}

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_KEY = 'random-kacis-save';

export function saveProgress(data: SaveData, storage: StorageBackend): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadProgress(storage: StorageBackend): SaveData | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' && parsed !== null &&
      typeof (parsed as SaveData).chapter === 'number' &&
      typeof (parsed as SaveData).scene === 'string'
    ) {
      return parsed as SaveData;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasSave(storage: StorageBackend): boolean {
  return loadProgress(storage) !== null;
}

export function clearProgress(storage: StorageBackend): void {
  storage.removeItem(SAVE_KEY);
}

export function browserStorage(): StorageBackend {
  return {
    getItem: (k) => window.localStorage.getItem(k),
    setItem: (k, v) => window.localStorage.setItem(k, v),
    removeItem: (k) => window.localStorage.removeItem(k),
  };
}
