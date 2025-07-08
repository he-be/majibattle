import { describe, test, expect, beforeEach } from 'vitest';
import { KanjiDataManager } from '../data/KanjiDataManager';

describe('KanjiDataManager', () => {
  let kanjiManager: KanjiDataManager;

  beforeEach(() => {
    kanjiManager = new KanjiDataManager();
  });

  describe('Database Initialization', () => {
    test('should initialize with kanji database', () => {
      expect(kanjiManager.getDatabaseSize()).toBeGreaterThan(0);
    });

    test('should have multiple categories', () => {
      const categories = kanjiManager.getAvailableCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('自然');
      expect(categories).toContain('魔法');
      expect(categories).toContain('武器');
    });

    test('should categorize kanji properly', () => {
      const natureKanji = kanjiManager.getKanjiByCategory('自然');
      expect(natureKanji.length).toBeGreaterThan(0);
      expect(natureKanji.some((k) => k.character === '火')).toBe(true);
      expect(natureKanji.some((k) => k.character === '水')).toBe(true);
    });
  });

  describe('generateRandomKanji', () => {
    test('should generate exactly 20 kanji by default', () => {
      const result = kanjiManager.generateRandomKanji();
      expect(result).toHaveLength(20);
    });

    test('should generate specified number of kanji', () => {
      const result = kanjiManager.generateRandomKanji(10);
      expect(result).toHaveLength(10);
    });

    test('should generate unique kanji without duplicates', () => {
      const result = kanjiManager.generateRandomKanji(20);
      const uniqueResult = [...new Set(result)];
      expect(uniqueResult).toHaveLength(20);
    });

    test('should throw error when requesting more kanji than available', () => {
      const databaseSize = kanjiManager.getDatabaseSize();
      expect(() => {
        kanjiManager.generateRandomKanji(databaseSize + 1);
      }).toThrow();
    });

    test('should generate different results on multiple calls', () => {
      const result1 = kanjiManager.generateRandomKanji(10);
      const result2 = kanjiManager.generateRandomKanji(10);

      // 完全に同じ結果になる確率は極めて低い
      expect(result1).not.toEqual(result2);
    });

    test('should include kanji from multiple categories', () => {
      const result = kanjiManager.generateRandomKanji(20);
      const categories = new Set<string>();

      for (const kanji of result) {
        const kanjiData = kanjiManager.getKanjiData(kanji);
        if (kanjiData) {
          categories.add(kanjiData.category);
        }
      }

      // 20個選ぶと複数のカテゴリが含まれるはず
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  describe('getKanjiData', () => {
    test('should return kanji data for existing character', () => {
      const kanjiData = kanjiManager.getKanjiData('火');
      expect(kanjiData).toBeTruthy();
      expect(kanjiData?.character).toBe('火');
      expect(kanjiData?.reading).toBe('か');
      expect(kanjiData?.meaning).toBe('火');
      expect(kanjiData?.category).toBe('自然');
    });

    test('should return null for non-existing character', () => {
      const kanjiData = kanjiManager.getKanjiData('存在しない');
      expect(kanjiData).toBeNull();
    });

    test('should return complete data structure', () => {
      const kanjiData = kanjiManager.getKanjiData('水');
      expect(kanjiData).toBeTruthy();
      expect(kanjiData).toHaveProperty('character');
      expect(kanjiData).toHaveProperty('reading');
      expect(kanjiData).toHaveProperty('meaning');
      expect(kanjiData).toHaveProperty('frequency');
      expect(kanjiData).toHaveProperty('category');
    });
  });

  describe('getKanjiByCategory', () => {
    test('should return kanji for existing category', () => {
      const magicKanji = kanjiManager.getKanjiByCategory('魔法');
      expect(magicKanji.length).toBeGreaterThan(0);
      expect(magicKanji.every((k) => k.category === '魔法')).toBe(true);
    });

    test('should return empty array for non-existing category', () => {
      const result = kanjiManager.getKanjiByCategory('存在しないカテゴリ');
      expect(result).toEqual([]);
    });

    test('should return proper kanji data structure', () => {
      const weaponKanji = kanjiManager.getKanjiByCategory('武器');
      expect(weaponKanji.length).toBeGreaterThan(0);

      const firstKanji = weaponKanji[0];
      expect(firstKanji).toHaveProperty('character');
      expect(firstKanji).toHaveProperty('reading');
      expect(firstKanji).toHaveProperty('meaning');
      expect(firstKanji).toHaveProperty('frequency');
      expect(firstKanji).toHaveProperty('category');
      expect(firstKanji.category).toBe('武器');
    });
  });

  describe('searchKanji', () => {
    test('should find kanji by character', () => {
      const result = kanjiManager.searchKanji('火');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((k) => k.character === '火')).toBe(true);
    });

    test('should find kanji by reading', () => {
      const result = kanjiManager.searchKanji('か');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((k) => k.reading.includes('か'))).toBe(true);
    });

    test('should find kanji by meaning', () => {
      const result = kanjiManager.searchKanji('火');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((k) => k.meaning.includes('火'))).toBe(true);
    });

    test('should find kanji by category', () => {
      const result = kanjiManager.searchKanji('自然');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((k) => k.category === '自然')).toBe(true);
    });

    test('should return empty array for non-matching query', () => {
      const result = kanjiManager.searchKanji('存在しない検索語');
      expect(result).toEqual([]);
    });

    test('should be case insensitive for reading search', () => {
      const result1 = kanjiManager.searchKanji('カ');
      const result2 = kanjiManager.searchKanji('か');
      expect(result1).toEqual(result2);
    });
  });

  describe('validateKanjiSelection', () => {
    test('should return true for unique kanji selection', () => {
      const selection = ['火', '水', '木', '金'];
      const result = kanjiManager.validateKanjiSelection(selection);
      expect(result).toBe(true);
    });

    test('should return false for duplicate kanji selection', () => {
      const selection = ['火', '水', '火', '金'];
      const result = kanjiManager.validateKanjiSelection(selection);
      expect(result).toBe(false);
    });

    test('should return true for empty selection', () => {
      const selection: string[] = [];
      const result = kanjiManager.validateKanjiSelection(selection);
      expect(result).toBe(true);
    });

    test('should return true for single kanji selection', () => {
      const selection = ['火'];
      const result = kanjiManager.validateKanjiSelection(selection);
      expect(result).toBe(true);
    });
  });

  describe('validateKanjiCombination', () => {
    test('should validate correct kanji combination', () => {
      const combination = ['火', '水', '木'];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect duplicate kanji', () => {
      const combination = ['火', '水', '火'];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('重複した漢字が含まれています');
    });

    test('should detect too many kanji', () => {
      const combination = ['火', '水', '木', '金', '土'];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('漢字は最大4文字までです');
    });

    test('should detect non-existing kanji', () => {
      const combination = ['火', '水', '存在しない'];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('存在しない'))).toBe(true);
    });

    test('should detect multiple errors simultaneously', () => {
      const combination = ['火', '水', '火', '存在しない', '金'];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('重複した漢字が含まれています');
      expect(result.errors).toContain('漢字は最大4文字までです');
    });

    test('should validate empty combination', () => {
      const combination: string[] = [];
      const result = kanjiManager.validateKanjiCombination(combination);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Performance and Data Quality', () => {
    test('should have reasonable database size', () => {
      const size = kanjiManager.getDatabaseSize();
      expect(size).toBeGreaterThan(50); // 最低限の漢字数
      expect(size).toBeLessThan(500); // 過度に大きすぎない
    });

    test('should have balanced frequency distribution', () => {
      const categories = kanjiManager.getAvailableCategories();
      expect(categories.length).toBeGreaterThan(5); // 複数のカテゴリ

      // 各カテゴリに適切な数の漢字があることを確認
      for (const category of categories) {
        const kanjiInCategory = kanjiManager.getKanjiByCategory(category);
        expect(kanjiInCategory.length).toBeGreaterThan(0);
      }
    });

    test('should generate kanji selection within reasonable time', () => {
      const startTime = performance.now();
      kanjiManager.generateRandomKanji(20);
      const endTime = performance.now();

      // 100ms以内で完了することを期待
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should have proper frequency values', () => {
      const allKanji = kanjiManager.searchKanji('');

      for (const kanji of allKanji) {
        expect(kanji.frequency).toBeGreaterThan(0);
        expect(kanji.frequency).toBeLessThanOrEqual(100);
      }
    });
  });
});
