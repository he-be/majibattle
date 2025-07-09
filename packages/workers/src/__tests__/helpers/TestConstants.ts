/**
 * テスト用定数とヘルパー関数
 * テストで使用する定数を一箇所で管理し、抽象化レイヤーの変更に対応
 */

import {
  MAGIC_ELEMENTS,
  FOLKLORE_ATTRIBUTES,
  TRADITIONAL_RARITIES,
  FOLKLORE_RARITIES,
  PROMPT_STYLES,
} from '../../config/SpellConstants';

// 各スタイル用のテストデータ
export const TEST_DATA = {
  [PROMPT_STYLES.TRADITIONAL]: {
    elements: [...MAGIC_ELEMENTS],
    rarities: [...TRADITIONAL_RARITIES],
    expectedFields: [
      'spell',
      'description',
      'effects',
      'power',
      'element',
      'rarity',
      'kanjiUsed',
      'createdAt',
    ],
    mockResponse: {
      name: '火水木金',
      kana: 'カスイモッキン',
      story: '四大元素の力を融合させた強力な呪文。自然の調和を保ちながら、圧倒的な力を発揮する。',
      effects: ['元素ダメージを与える', '対象を混乱させる', '術者の魔力を回復する'],
      power: 8,
      attribute: '火',
      rarity: 'epic',
    },
  },
  [PROMPT_STYLES.FOLKLORE]: {
    elements: [...FOLKLORE_ATTRIBUTES],
    rarities: [...FOLKLORE_RARITIES],
    expectedFields: [
      'name',
      'kana',
      'story',
      'origin',
      'effects',
      'power',
      'attribute',
      'rarity',
      'kanjiUsed',
      'createdAt',
    ],
    mockResponse: {
      name: '火水木金',
      kana: 'カスイモッキン',
      story:
        '古来より火と水の調和を求め、木の生命力と金の堅固さを結びつける呪い。四大元素の均衡を保つ神聖な儀式で用いられた。',
      origin:
        'ある火山の麓の村で、水害と火災を鎮める目的で生まれたが、後に金欲にまみれた術者が濫用し、元素の均衡を崩すだけの危険な呪いへと変質した。',
      attribute: '五穀豊穣',
      power: 5,
      rarity: 'Rare',
      effects: [
        '術者の手のひらに、火・水・木・金を象徴する小さな紋様が一時的に現れる。',
        '周囲の金属が微かに温かくなり、木製品から水の香りがする。',
        '満月の夜、術者の影が4つの元素の形を順番に模倣する。',
      ],
    },
  },
};

// 共通テストヘルパー
export const TestHelpers = {
  /**
   * 指定したスタイルの有効な属性リストを取得
   */
  getValidElements: (style: string) => {
    return style === PROMPT_STYLES.TRADITIONAL ? MAGIC_ELEMENTS : FOLKLORE_ATTRIBUTES;
  },

  /**
   * 指定したスタイルの有効なレアリティリストを取得
   */
  getValidRarities: (style: string) => {
    return style === PROMPT_STYLES.TRADITIONAL ? TRADITIONAL_RARITIES : FOLKLORE_RARITIES;
  },

  /**
   * 指定したスタイルで期待される結果フィールドを取得
   */
  getExpectedFields: (style: string) => {
    return TEST_DATA[style as keyof typeof TEST_DATA].expectedFields;
  },

  /**
   * 指定したスタイル用のモックレスポンスを取得
   */
  getMockResponse: (style: string) => {
    return TEST_DATA[style as keyof typeof TEST_DATA].mockResponse;
  },

  /**
   * 結果が指定したスタイルの形式に適合しているかチェック
   */
  validateResultFormat: (result: any, style: string): boolean => {
    const expectedFields = TestHelpers.getExpectedFields(style);
    return expectedFields.every((field) => Object.prototype.hasOwnProperty.call(result, field));
  },

  /**
   * 属性が指定したスタイルで有効かチェック
   */
  isValidElement: (element: string, style: string): boolean => {
    const validElements = TestHelpers.getValidElements(style);
    return (validElements as readonly string[]).includes(element);
  },

  /**
   * レアリティが指定したスタイルで有効かチェック
   */
  isValidRarity: (rarity: string, style: string): boolean => {
    const validRarities = TestHelpers.getValidRarities(style);
    return (validRarities as readonly string[]).includes(rarity);
  },
};

// 共通テスト漢字
export const TEST_KANJI = ['火', '水', '木', '金'];
export const TEST_KANJI_HIGH_FREQ = ['一', '二', '三', '四'];
export const TEST_KANJI_LOW_FREQ = ['龍', '鎧', '槍', '蝿'];
