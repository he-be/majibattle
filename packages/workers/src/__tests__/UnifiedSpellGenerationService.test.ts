import { describe, test, expect, vi, beforeEach } from 'vitest';
import { UnifiedSpellGenerationService } from '../services/UnifiedSpellGenerationService';
import { PROMPT_STYLES } from '../config/SpellConstants';
import {
  TestHelpers,
  TEST_KANJI,
  TEST_KANJI_HIGH_FREQ,
  TEST_KANJI_LOW_FREQ,
} from './helpers/TestConstants';

// Mock fetch globally
global.fetch = vi.fn() as any;

describe('UnifiedSpellGenerationService', () => {
  let service: UnifiedSpellGenerationService;
  const mockApiKey = 'test-api-key';
  const mockModel = 'gemini-2.5-flash-lite-preview-06-17';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UnifiedSpellGenerationService(mockApiKey, mockModel);
  });

  describe('generateSpell', () => {
    test('should throw error if not exactly 4 kanji provided', async () => {
      await expect(service.generateSpell(['火', '水', '木'])).rejects.toThrow(
        'Exactly 4 kanji must be selected for spell generation'
      );
    });

    describe('Traditional style', () => {
      beforeEach(() => {
        service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);
      });

      test('should generate fallback spell when API fails', async () => {
        // Mock fetch to reject
        (global.fetch as any).mockRejectedValue(new Error('API Error'));

        const result = await service.generateSpell(TEST_KANJI);

        expect(result).toBeDefined();
        expect(TestHelpers.validateResultFormat(result, PROMPT_STYLES.TRADITIONAL)).toBe(true);
        expect((result as any).spell).toBe('火水木金');
        expect((result as any).kanjiUsed).toEqual(TEST_KANJI);
        expect((result as any).effects).toHaveLength(3);
        expect((result as any).power).toBeGreaterThan(0);
        expect((result as any).power).toBeLessThanOrEqual(10);
        expect(TestHelpers.isValidRarity((result as any).rarity, PROMPT_STYLES.TRADITIONAL)).toBe(
          true
        );
        expect(TestHelpers.isValidElement((result as any).element, PROMPT_STYLES.TRADITIONAL)).toBe(
          true
        );
      });

      test('should parse successful Gemini API response', async () => {
        const mockResponse = TestHelpers.getMockResponse(PROMPT_STYLES.TRADITIONAL);
        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `{
                      "name": "${mockResponse.name}",
                      "kana": "${mockResponse.kana}",
                      "story": "${mockResponse.story}",
                      "effects": ${JSON.stringify(mockResponse.effects)},
                      "power": ${mockResponse.power},
                      "attribute": "${mockResponse.attribute}",
                      "rarity": "${mockResponse.rarity}"
                    }`,
                  },
                ],
              },
            },
          ],
        };

        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse,
        });

        const result = await service.generateSpell(TEST_KANJI);

        expect(TestHelpers.validateResultFormat(result, PROMPT_STYLES.TRADITIONAL)).toBe(true);
        expect((result as any).spell).toBe(mockResponse.name);
        expect((result as any).description).toContain(mockResponse.story);
        expect((result as any).effects).toHaveLength(3);
        expect((result as any).power).toBe(mockResponse.power);
        expect((result as any).element).toBe(mockResponse.attribute);
        expect((result as any).rarity).toBe(mockResponse.rarity);
        expect((result as any).kanjiUsed).toEqual(TEST_KANJI);
      });
    });

    describe('Folklore style', () => {
      beforeEach(() => {
        service.setPromptStyle(PROMPT_STYLES.FOLKLORE);
      });

      test('should generate fallback folklore spell when API fails', async () => {
        // Mock fetch to reject
        (global.fetch as any).mockRejectedValue(new Error('API Error'));

        const result = await service.generateSpell(TEST_KANJI);

        expect(result).toBeDefined();
        expect(TestHelpers.validateResultFormat(result, PROMPT_STYLES.FOLKLORE)).toBe(true);
        expect((result as any).name).toBe('火水木金');
        expect((result as any).kana).toBeDefined();
        expect((result as any).story).toBeDefined();
        expect((result as any).origin).toBeDefined();
        expect((result as any).kanjiUsed).toEqual(TEST_KANJI);
        expect((result as any).effects).toHaveLength(3);
        expect((result as any).power).toBeGreaterThan(0);
        expect((result as any).power).toBeLessThanOrEqual(10);
        expect(TestHelpers.isValidRarity((result as any).rarity, PROMPT_STYLES.FOLKLORE)).toBe(
          true
        );
        expect(TestHelpers.isValidElement((result as any).attribute, PROMPT_STYLES.FOLKLORE)).toBe(
          true
        );
      });

      test('should parse successful folklore Gemini API response', async () => {
        const mockResponse = TestHelpers.getMockResponse(PROMPT_STYLES.FOLKLORE);
        const mockApiResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `{
                      "name": "${mockResponse.name}",
                      "kana": "${mockResponse.kana}",
                      "story": "${mockResponse.story}",
                      "origin": "${(mockResponse as any).origin}",
                      "effects": ${JSON.stringify(mockResponse.effects)},
                      "power": ${mockResponse.power},
                      "attribute": "${mockResponse.attribute}",
                      "rarity": "${mockResponse.rarity}"
                    }`,
                  },
                ],
              },
            },
          ],
        };

        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => mockApiResponse,
        });

        const result = await service.generateSpell(TEST_KANJI);

        expect(TestHelpers.validateResultFormat(result, PROMPT_STYLES.FOLKLORE)).toBe(true);
        expect((result as any).name).toBe(mockResponse.name);
        expect((result as any).kana).toBe(mockResponse.kana);
        expect((result as any).story).toBe(mockResponse.story);
        expect((result as any).origin).toBe((mockResponse as any).origin);
        expect((result as any).effects).toHaveLength(3);
        expect((result as any).power).toBe(mockResponse.power);
        expect((result as any).attribute).toBe(mockResponse.attribute);
        expect((result as any).rarity).toBe(mockResponse.rarity);
        expect((result as any).kanjiUsed).toEqual(TEST_KANJI);
      });
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
      const result = await service.generateSpell(TEST_KANJI);
      expect((result as any).name || (result as any).spell).toBe('火水木金');
    });
  });

  describe('Style switching', () => {
    test('should switch between traditional and folklore styles', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Test traditional style
      service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);
      const traditionalResult = await service.generateSpell(TEST_KANJI);
      expect(TestHelpers.validateResultFormat(traditionalResult, PROMPT_STYLES.TRADITIONAL)).toBe(
        true
      );

      // Test folklore style
      service.setPromptStyle(PROMPT_STYLES.FOLKLORE);
      const folkloreResult = await service.generateSpell(TEST_KANJI);
      expect(TestHelpers.validateResultFormat(folkloreResult, PROMPT_STYLES.FOLKLORE)).toBe(true);

      // Verify they have different structures
      expect('spell' in traditionalResult).toBe(true);
      expect('name' in folkloreResult).toBe(true);
      expect('origin' in (folkloreResult as any)).toBe(true);
      expect('origin' in (traditionalResult as any)).toBe(false);
    });
  });

  describe('Element and rarity validation', () => {
    test('should validate elements for traditional style', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));
      service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);

      const result = await service.generateSpell(TEST_KANJI);
      const validElements = TestHelpers.getValidElements(PROMPT_STYLES.TRADITIONAL);

      expect(validElements).toContain((result as any).element);
    });

    test('should validate attributes for folklore style', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));
      service.setPromptStyle(PROMPT_STYLES.FOLKLORE);

      const result = await service.generateSpell(TEST_KANJI);
      const validAttributes = TestHelpers.getValidElements(PROMPT_STYLES.FOLKLORE);

      expect(validAttributes).toContain((result as any).attribute);
    });

    test('should validate rarities for both styles', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Traditional rarities
      service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);
      const traditionalResult = await service.generateSpell(TEST_KANJI);
      const traditionalRarities = TestHelpers.getValidRarities(PROMPT_STYLES.TRADITIONAL);
      expect(traditionalRarities).toContain((traditionalResult as any).rarity);

      // Folklore rarities
      service.setPromptStyle(PROMPT_STYLES.FOLKLORE);
      const folkloreResult = await service.generateSpell(TEST_KANJI);
      const folkloreRarities = TestHelpers.getValidRarities(PROMPT_STYLES.FOLKLORE);
      expect(folkloreRarities).toContain((folkloreResult as any).rarity);
    });
  });

  describe('Fallback spell generation', () => {
    test('should generate appropriate fallback spells for both styles', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      // Test traditional fallback
      service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);
      const traditionalResult = await service.generateSpell(TEST_KANJI_HIGH_FREQ);
      expect((traditionalResult as any).spell).toBe('一二三四');
      expect((traditionalResult as any).description).toContain('踊り狂う');

      // Test folklore fallback
      service.setPromptStyle(PROMPT_STYLES.FOLKLORE);
      const folkloreResult = await service.generateSpell(TEST_KANJI_LOW_FREQ);
      expect((folkloreResult as any).name).toBe('龍鎧槍蝿');
      expect((folkloreResult as any).story).toContain('古来より');
      expect((folkloreResult as any).origin).toContain('ある村人が');
    });
  });
});
