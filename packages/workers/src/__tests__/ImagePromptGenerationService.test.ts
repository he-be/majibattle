import { describe, test, expect } from 'vitest';
import { ImagePromptGenerationService } from '../services/ImagePromptGenerationService';
import { SpellResult, FolkloreSpellResult } from '@majibattle/shared';

describe('ImagePromptGenerationService', () => {
  const service = new ImagePromptGenerationService();

  describe('generatePrompt', () => {
    test('should generate prompt for traditional spell', () => {
      const spell: SpellResult = {
        spell: '火水土風',
        description: '四大元素を操る強力な呪文',
        effects: ['火の玉を投げる', '水流を操る', '大地を震わせる'],
        power: 8,
        element: '火',
        rarity: 'epic',
        createdAt: new Date(),
        kanjiUsed: ['火', '水', '土', '風'],
      };

      const result = service.generatePrompt(spell);

      expect(result.prompt).toContain(
        'masterpiece,best quality,amazing quality,fantasy art, game illustration'
      );
      expect(result.prompt).toContain('fire element');
      expect(result.negativePrompt).toBe(
        'nsfw, bad quality,worst quality,worst detail,sketch,censor, text, logo, watermark'
      );
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
      expect(result.steps).toBe(20);
      expect(result.cfgScale).toBe(7);
      expect(result.seed).toBe(-1);
      expect(result.samplerName).toBe('Euler a');
      expect(result.checkpoint).toBe('sd\\waiNSFWIllustrious_v140.safetensors');
    });

    test('should generate prompt for folklore spell', () => {
      const spell: FolkloreSpellResult = {
        name: '雷移封茶',
        kana: 'ライイフウチャ',
        story: '古来より雷を司る村で伝えられる呪い',
        origin: 'ある村人が茶への執着から生まれた',
        effects: ['雷が移る現象', '封じる記憶変化', '茶の感触'],
        power: 7,
        attribute: '禁忌',
        rarity: 'Rare',
        createdAt: new Date(),
        kanjiUsed: ['雷', '移', '封', '茶'],
      };

      const result = service.generatePrompt(spell);

      expect(result.prompt).toContain(
        'masterpiece,best quality,amazing quality,fantasy art, game illustration'
      );
      expect(result.prompt).toContain('lightning');
      expect(result.negativePrompt).toBe(
        'nsfw, bad quality,worst quality,worst detail,sketch,censor, text, logo, watermark'
      );
    });

    test('should handle different rarities with fixed quality tags', () => {
      const uselessSpell: SpellResult = {
        spell: '弱弱弱弱',
        description: 'とても弱い呪文',
        effects: ['何も起こらない'],
        power: 1,
        element: '無',
        rarity: 'useless',
        createdAt: new Date(),
        kanjiUsed: ['弱', '弱', '弱', '弱'],
      };

      const legendarySpell: SpellResult = {
        spell: '神神神神',
        description: '神々しい力の呪文',
        effects: ['世界を変える'],
        power: 10,
        element: '聖',
        rarity: 'legendary',
        createdAt: new Date(),
        kanjiUsed: ['神', '神', '神', '神'],
      };

      const uselessResult = service.generatePrompt(uselessSpell);
      const legendaryResult = service.generatePrompt(legendarySpell);

      // レアリティに関係なく同じ品質タグを使用
      expect(uselessResult.prompt).toContain('masterpiece,best quality,amazing quality');
      expect(legendaryResult.prompt).toContain('masterpiece,best quality,amazing quality');
      expect(legendaryResult.prompt).toContain('divine elements'); // 説明文から抽出
    });

    test('should extract visual elements from effects', () => {
      const spell: SpellResult = {
        spell: '青炎金影',
        description: '青い炎と金の影が踊る呪文',
        effects: ['青い炎が浮く', '金色の光が踊る', '影が猫の形をする'],
        power: 6,
        element: '火',
        rarity: 'rare',
        createdAt: new Date(),
        kanjiUsed: ['青', '炎', '金', '影'],
      };

      const result = service.generatePrompt(spell);

      expect(result.prompt).toContain('blue magical effects');
      expect(result.prompt).toContain('golden gleaming');
      expect(result.prompt).toContain('floating objects');
      expect(result.prompt).toContain('dancing motion');
      expect(result.prompt).toContain('cat motif');
    });

    test('should handle different attributes correctly', () => {
      const fireSpell: SpellResult = {
        spell: '火火火火',
        description: '火の呪文',
        effects: ['燃える'],
        power: 5,
        element: '火',
        rarity: 'common',
        createdAt: new Date(),
        kanjiUsed: ['火', '火', '火', '火'],
      };

      const folkloreSpell: FolkloreSpellResult = {
        name: '豊作祈願',
        kana: 'ホウサクキガン',
        story: '豊作を願う村の祈り',
        origin: '農民の願い',
        effects: ['穀物が育つ'],
        power: 4,
        attribute: '五穀豊穣',
        rarity: 'Common',
        createdAt: new Date(),
        kanjiUsed: ['豊', '作', '祈', '願'],
      };

      const fireResult = service.generatePrompt(fireSpell);
      const folkloreResult = service.generatePrompt(folkloreSpell);

      expect(fireResult.prompt).toContain('fire element');
      expect(fireResult.prompt).toContain('red orange flames');
      expect(folkloreResult.prompt).toContain('harvest abundance');
      expect(folkloreResult.prompt).toContain('golden grain fields');

      // 両方とも固定品質タグを使用
      expect(fireResult.prompt).toContain('masterpiece,best quality,amazing quality');
      expect(folkloreResult.prompt).toContain('masterpiece,best quality,amazing quality');
    });

    test('should extract symbolism from spell name', () => {
      const spell: SpellResult = {
        spell: '龍神雷剣',
        description: '龍の神が雷の剣を振るう',
        effects: ['雷撃'],
        power: 9,
        element: '雷',
        rarity: 'legendary',
        createdAt: new Date(),
        kanjiUsed: ['龍', '神', '雷', '剣'],
      };

      const result = service.generatePrompt(spell);

      expect(result.prompt).toContain('dragon motif');
      expect(result.prompt).toContain('divine halo');
      expect(result.prompt).toContain('lightning symbol');
    });
  });
});
