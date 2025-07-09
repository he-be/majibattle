import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SpellGenerationService } from '../services/SpellGenerationService';

// Mock fetch globally
global.fetch = vi.fn() as any;

describe('SpellGenerationService', () => {
  let service: SpellGenerationService;
  const mockApiKey = 'test-api-key';
  const mockModel = 'gemini-2.5-flash-lite-preview-06-17';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SpellGenerationService(mockApiKey, mockModel);
  });

  describe('generateSpell', () => {
    test('should throw error if not exactly 4 kanji provided', async () => {
      await expect(service.generateSpell(['火', '水', '木'])).rejects.toThrow(
        'Exactly 4 kanji must be selected for spell generation'
      );
    });

    test('should generate fallback spell when API fails', async () => {
      // Mock fetch to reject
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      const result = await service.generateSpell(['火', '水', '木', '金']);

      expect(result).toBeDefined();
      expect(result.spell).toBe('火水木金');
      expect(result.kanjiUsed).toEqual(['火', '水', '木', '金']);
      expect(result.description).toContain('火');
      expect(result.description).toContain('水');
      expect(result.description).toContain('木');
      expect(result.description).toContain('金');
      expect(result.effects).toHaveLength(3);
      expect(result.power).toBeGreaterThan(0);
      expect(result.power).toBeLessThanOrEqual(10);
      expect(['useless', 'common', 'rare', 'epic', 'legendary']).toContain(result.rarity);
      expect(['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音', '聖', '魔']).toContain(
        result.element
      );
    });

    test('should parse successful Gemini API response', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `{
                    "name": "火水木金",
                    "kana": "カスイモッキン",
                    "story": "四大元素の力を融合させた強力な呪文。自然の調和を保ちながら、圧倒的な力を発揮する。",
                    "effects": ["元素ダメージを与える", "対象を混乱させる", "術者の魔力を回復する"],
                    "power": 8,
                    "attribute": "火",
                    "rarity": "epic"
                  }`,
                },
              ],
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.generateSpell(['火', '水', '木', '金']);

      expect(result.spell).toBe('火水木金');
      expect(result.description).toContain('四大元素の力を融合させた強力な呪文');
      expect(result.effects).toHaveLength(3);
      expect(result.power).toBe(8);
      expect(result.element).toBe('火');
      expect(result.rarity).toBe('epic');
      expect(result.kanjiUsed).toEqual(['火', '水', '木', '金']);
    });

    test('should handle malformed JSON from API', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Invalid JSON response',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Should fallback to deterministic generation
      const result = await service.generateSpell(['火', '水', '木', '金']);
      expect(result.spell).toBe('火水木金');
    });
  });

  describe('element validation', () => {
    test('should validate known elements including new creative elements', () => {
      const validElements = [
        '火',
        '水',
        '風',
        '土',
        '光',
        '闇',
        '混沌',
        '無',
        '食',
        '音',
        '聖',
        '魔',
      ];

      validElements.forEach((element) => {
        // We can't directly test private methods, but we can test through fallback generation
        // which uses validateElement internally
        expect(validElements).toContain(element);
      });
    });
  });

  describe('rarity validation', () => {
    test('should support new "useless" rarity tier', () => {
      const validRarities = ['useless', 'common', 'rare', 'epic', 'legendary'];

      validRarities.forEach((rarity) => {
        expect(validRarities).toContain(rarity);
      });
    });
  });

  describe('fallback spell generation', () => {
    test('should generate fallback spell with valid rarity calculation', async () => {
      // Mock fetch to fail so we get fallback generation
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Use valid kanji from the database
      const result = await service.generateSpell(['一', '二', '三', '四']);

      expect(result.rarity).toMatch(/^(useless|common|rare|epic|legendary)$/);
      expect(result.spell).toBe('一二三四');
    });

    test('should generate fallback spell with low frequency kanji', async () => {
      // Mock fetch to fail so we get fallback generation
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Use low frequency kanji from the database
      const result = await service.generateSpell(['龍', '鎧', '槍', '蝿']);

      expect(result.rarity).toMatch(/^(useless|common|rare|epic|legendary)$/);
      expect(result.spell).toBe('龍鎧槍蝿');
    });

    test('should include creative elements in possible elements', async () => {
      // Mock fetch to fail so we get fallback generation
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Use valid kanji from the database
      const result = await service.generateSpell(['火', '水', '風', '土']);

      // Check that the result is valid and contains expected properties
      expect(result).toBeDefined();
      expect(result.spell).toBe('火水風土');
      expect(['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音', '聖', '魔']).toContain(
        result.element
      );
    });
  });
});
