import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, hasSave, clearProgress, type StorageBackend } from '../src/data/save';

function memoryStorage(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

describe('kayıt sistemi', () => {
  let storage: StorageBackend;
  beforeEach(() => { storage = memoryStorage(); });

  it('kayıt yokken loadProgress null döner', () => {
    expect(loadProgress(storage)).toBeNull();
    expect(hasSave(storage)).toBe(false);
  });

  it('kaydeder ve geri yükler', () => {
    saveProgress({ chapter: 1, scene: 'Chapter1_Halay' }, storage);
    expect(loadProgress(storage)).toEqual({ chapter: 1, scene: 'Chapter1_Halay' });
    expect(hasSave(storage)).toBe(true);
  });

  it('clearProgress kaydı siler', () => {
    saveProgress({ chapter: 1, scene: 'Chapter1_Halay' }, storage);
    clearProgress(storage);
    expect(loadProgress(storage)).toBeNull();
  });

  it('bozuk veri null döner, çökmez', () => {
    storage.setItem('random-kacis-save', '{bozuk json');
    expect(loadProgress(storage)).toBeNull();
  });
});
