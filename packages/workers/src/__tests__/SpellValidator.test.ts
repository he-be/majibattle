import { describe, test, expect } from 'vitest';
import { SpellValidator } from '../utils/SpellValidator';
import { PROMPT_STYLES } from '../config/SpellConstants';

describe('SpellValidator', () => {
  describe('Traditional style validation', () => {
    const validator = new SpellValidator(PROMPT_STYLES.TRADITIONAL);

    test('should validate text length and truncate if exceeded', () => {
      const longText = 'あ'.repeat(150); // 150文字
      const result = validator.validateTextLength(longText, 140);

      expect(result).toHaveLength(141); // 140 + '…'
      expect(result.endsWith('…')).toBe(true);
      expect(result.substring(0, 140)).toBe('あ'.repeat(140));
    });

    test('should not truncate text within limit', () => {
      const shortText = 'あ'.repeat(100);
      const result = validator.validateTextLength(shortText, 140);

      expect(result).toBe(shortText);
      expect(result).toHaveLength(100);
    });

    test('should validate story with 140 character limit', () => {
      const longStory = '昔々ある所に'.repeat(30); // 長い物語
      const result = validator.validateStory(longStory);

      expect(result.length).toBeLessThanOrEqual(141); // 140 + '…'
      if (result.length > 140) {
        expect(result.endsWith('…')).toBe(true);
      }
    });

    test('should handle empty or invalid text', () => {
      expect(validator.validateTextLength('')).toBe('');
      expect(validator.validateTextLength(null as unknown as string)).toBe('');
      expect(validator.validateTextLength(undefined as unknown as string)).toBe('');
    });
  });

  describe('Folklore style validation', () => {
    const validator = new SpellValidator(PROMPT_STYLES.FOLKLORE);

    test('should validate origin text for folklore style', () => {
      const longOrigin = 'ある村で起こった不思議な出来事が'.repeat(20);
      const result = validator.validateOrigin(longOrigin);

      expect(result.length).toBeLessThanOrEqual(141); // 140 + '…'
      if (result.length > 140) {
        expect(result.endsWith('…')).toBe(true);
      }
    });

    test('should handle empty origin', () => {
      expect(validator.validateOrigin('')).toBe('');
      expect(validator.validateOrigin(undefined)).toBe('');
    });

    test('should validate both story and origin', () => {
      const longStory = '昔々ある所に'.repeat(30);
      const longOrigin = 'ある村で起こった不思議な出来事が'.repeat(20);

      const storyResult = validator.validateStory(longStory);
      const originResult = validator.validateOrigin(longOrigin);

      expect(storyResult.length).toBeLessThanOrEqual(141);
      expect(originResult.length).toBeLessThanOrEqual(141);
    });
  });

  describe('Style switching', () => {
    test('should handle style changes correctly', () => {
      const validator = new SpellValidator(PROMPT_STYLES.TRADITIONAL);

      // Traditional style - no origin validation
      expect(validator.validateOrigin('test origin')).toBe('test origin');

      // Switch to folklore style
      validator.setStyle(PROMPT_STYLES.FOLKLORE);

      // Folklore style - origin validation active
      const longOrigin = 'あ'.repeat(150);
      const result = validator.validateOrigin(longOrigin);
      expect(result.length).toBeLessThanOrEqual(141);
    });
  });

  describe('Edge cases', () => {
    const validator = new SpellValidator(PROMPT_STYLES.TRADITIONAL);

    test('should handle exactly 140 characters', () => {
      const exactText = 'あ'.repeat(140);
      const result = validator.validateTextLength(exactText, 140);

      expect(result).toBe(exactText);
      expect(result.length).toBe(140);
    });

    test('should handle 141 characters', () => {
      const overText = 'あ'.repeat(141);
      const result = validator.validateTextLength(overText, 140);

      expect(result).toHaveLength(141); // 140 + '…'
      expect(result.endsWith('…')).toBe(true);
    });

    test('should handle different character types', () => {
      const mixedText = 'ABC漢字ひらがなカタカナ123!@#'.repeat(10);
      const result = validator.validateTextLength(mixedText, 140);

      expect(result.length).toBeLessThanOrEqual(141);
    });
  });
});
