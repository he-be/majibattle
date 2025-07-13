/**
 * 呪文データの動的バリデーション
 * プロンプトスタイルに応じて適切な検証を行います
 */

import {
  MAGIC_ELEMENTS,
  FOLKLORE_ATTRIBUTES,
  TRADITIONAL_RARITIES,
  FOLKLORE_RARITIES,
  DEFAULT_ELEMENT,
  DEFAULT_RARITY_TRADITIONAL,
  DEFAULT_RARITY_FOLKLORE,
  MAX_POWER,
  MIN_POWER,
  DEFAULT_POWER,
  PROMPT_STYLES,
  type PromptStyle,
  type SpellElement,
  type SpellRarity,
  type MagicElement,
  type FolkloreAttribute,
  type TraditionalRarity,
  type FolkloreRarity,
} from '../config/SpellConstants';

export class SpellValidator {
  constructor(private style: PromptStyle) {}

  /**
   * 属性を検証し、無効な場合はデフォルト値を返す
   */
  validateElement(element: string): SpellElement {
    if (this.style === PROMPT_STYLES.TRADITIONAL) {
      return MAGIC_ELEMENTS.includes(element as MagicElement)
        ? (element as MagicElement)
        : DEFAULT_ELEMENT;
    } else {
      return FOLKLORE_ATTRIBUTES.includes(element as FolkloreAttribute)
        ? (element as FolkloreAttribute)
        : (FOLKLORE_ATTRIBUTES[0] as FolkloreAttribute); // 五穀豊穣をデフォルトに
    }
  }

  /**
   * レアリティを検証し、無効な場合はデフォルト値を返す
   */
  validateRarity(rarity: string): SpellRarity {
    if (this.style === PROMPT_STYLES.TRADITIONAL) {
      return TRADITIONAL_RARITIES.includes(rarity as TraditionalRarity)
        ? (rarity as TraditionalRarity)
        : DEFAULT_RARITY_TRADITIONAL;
    } else {
      return FOLKLORE_RARITIES.includes(rarity as FolkloreRarity)
        ? (rarity as FolkloreRarity)
        : DEFAULT_RARITY_FOLKLORE;
    }
  }

  /**
   * 威力値を検証し、範囲内に収める
   */
  validatePower(power: any): number {
    const numPower = parseInt(power);
    if (isNaN(numPower)) {
      return DEFAULT_POWER;
    }
    return Math.min(MAX_POWER, Math.max(MIN_POWER, numPower));
  }

  /**
   * 効果配列を検証し、正しい形式に整える
   */
  validateEffects(effects: any): string[] {
    if (Array.isArray(effects)) {
      return effects.slice(0, 3).map((effect) => String(effect));
    }
    return ['効果不明'];
  }

  /**
   * 文字数を検証し、140文字を超える場合は切り詰める
   */
  validateTextLength(text: string, maxLength: number = 140): string {
    if (typeof text !== 'string') {
      return '';
    }
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  }

  /**
   * 説明文（story）を検証
   */
  validateStory(story: string): string {
    return this.validateTextLength(story, 140);
  }

  /**
   * 由来・伝承（origin）を検証（民俗学スタイルのみ）
   */
  validateOrigin(origin?: string): string {
    if (this.style === PROMPT_STYLES.FOLKLORE && origin) {
      return this.validateTextLength(origin, 140);
    }
    return origin || '';
  }

  /**
   * 利用可能な属性一覧を取得
   */
  getValidElements(): readonly SpellElement[] {
    return this.style === PROMPT_STYLES.TRADITIONAL ? MAGIC_ELEMENTS : FOLKLORE_ATTRIBUTES;
  }

  /**
   * 利用可能なレアリティ一覧を取得
   */
  getValidRarities(): readonly SpellRarity[] {
    return this.style === PROMPT_STYLES.TRADITIONAL ? TRADITIONAL_RARITIES : FOLKLORE_RARITIES;
  }

  /**
   * プロンプトスタイルを変更
   */
  setStyle(style: PromptStyle): void {
    this.style = style;
  }

  /**
   * 現在のスタイルを取得
   */
  getStyle(): PromptStyle {
    return this.style;
  }
}

// ファクトリー関数
export const createValidator = (style: PromptStyle): SpellValidator => {
  return new SpellValidator(style);
};

// デフォルトバリデーター（民俗学スタイル）
export const defaultValidator = createValidator(PROMPT_STYLES.FOLKLORE);
