import { describe, it, expect } from 'vitest';
import { SpellResultAdapter } from '../adapters/SpellResultAdapter';
import { SpellResult, FolkloreSpellResult } from '@majibattle/shared';

describe('SpellResultAdapter', () => {
  describe('toUnifiedFormat', () => {
    it('should pass through traditional SpellResult unchanged', () => {
      const traditionalResult: SpellResult = {
        spell: '火水土風',
        description: '四大元素を操る強力な呪文',
        effects: ['火属性ダメージ', '水属性回復', '土属性防御'],
        power: 8,
        element: '火',
        rarity: 'epic',
        createdAt: new Date(),
        kanjiUsed: ['火', '水', '土', '風'],
      };

      const result = SpellResultAdapter.toUnifiedFormat(traditionalResult);

      expect(result).toEqual(traditionalResult);
    });

    it('should convert FolkloreSpellResult to unified format', () => {
      const folkloreResult: FolkloreSpellResult = {
        name: '雷移封茶',
        kana: 'ライイフウチャ',
        story: '古来より雷を司る村で伝えられる呪い',
        origin: 'ある村人が茶への執着から生まれた',
        effects: ['雷が移るような現象', '封じるの記憶変化', '茶の感触'],
        power: 7,
        attribute: '禁忌',
        rarity: 'Rare',
        createdAt: new Date(),
        kanjiUsed: ['雷', '移', '封', '茶'],
      };

      const result = SpellResultAdapter.toUnifiedFormat(folkloreResult);

      expect(result.spell).toBe('雷移封茶');
      expect(result.description).toBe('古来より雷を司る村で伝えられる呪い');
      expect(result.description).not.toContain('【由来】'); // 由来は別フィールドで表示するため含まない
      expect(result.element).toBe('禁忌');
      expect(result.rarity).toBe('Rare');
      expect(result.effects).toEqual(folkloreResult.effects);
      expect(result.power).toBe(7);
      expect(result.kana).toBe('ライイフウチャ');
      expect(result.origin).toBe('ある村人が茶への執着から生まれた');
      expect(result.kanjiUsed).toEqual(['雷', '移', '封', '茶']);
    });

    it('should handle FolkloreSpellResult without origin', () => {
      const folkloreResult: FolkloreSpellResult = {
        name: '火土水風',
        kana: 'カドスイフウ',
        story: '四大元素の物語',
        origin: '',
        effects: ['効果1', '効果2'],
        power: 5,
        attribute: '五穀豊穣',
        rarity: 'Common',
        createdAt: new Date(),
        kanjiUsed: ['火', '土', '水', '風'],
      };

      const result = SpellResultAdapter.toUnifiedFormat(folkloreResult);

      expect(result.description).toBe('四大元素の物語');
      expect(result.description).not.toContain('【由来】');
      expect(result.origin).toBe('');
    });
  });

  describe('style detection', () => {
    it('should correctly identify FolkloreSpellResult', () => {
      const folkloreResult = {
        name: 'test',
        story: 'test story',
        attribute: 'test attr',
        // other fields...
      };

      expect(SpellResultAdapter.isFolkloreStyle(folkloreResult as any)).toBe(true);
    });

    it('should correctly identify traditional SpellResult', () => {
      const traditionalResult = {
        spell: 'test',
        description: 'test desc',
        element: 'test elem',
        // other fields...
      };

      expect(SpellResultAdapter.isTraditionalStyle(traditionalResult as any)).toBe(true);
    });
  });
});
