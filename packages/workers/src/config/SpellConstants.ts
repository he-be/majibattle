/**
 * 呪文生成システムの定数定義
 * 新しい属性やレアリティを追加する際は、ここを更新してください
 */

// 従来の魔法系属性
export const MAGIC_ELEMENTS = [
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
] as const;

// 新しい民俗学的属性
export const FOLKLORE_ATTRIBUTES = [
  '五穀豊穣',
  '厄除け',
  '恋愛成就',
  '雨乞い',
  '神隠し',
  '禁忌',
  '豊穣・家畜',
  '祈願・精霊',
  '健康長寿',
  '商売繁盛',
  '学業成就',
  '無病息災',
  '魔除け',
  '縁結び',
  '安産祈願',
  '交通安全',
] as const;

// 従来のレアリティ
export const TRADITIONAL_RARITIES = ['useless', 'common', 'rare', 'epic', 'legendary'] as const;

// 新しいレアリティ（民俗学スタイル）
export const FOLKLORE_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;

// プロンプトスタイル
export const PROMPT_STYLES = {
  TRADITIONAL: 'traditional', // 従来の魔法系プロンプト
  FOLKLORE: 'folklore', // 新しい民俗学プロンプト
} as const;

// 型定義
export type MagicElement = (typeof MAGIC_ELEMENTS)[number];
export type FolkloreAttribute = (typeof FOLKLORE_ATTRIBUTES)[number];
export type TraditionalRarity = (typeof TRADITIONAL_RARITIES)[number];
export type FolkloreRarity = (typeof FOLKLORE_RARITIES)[number];
export type PromptStyle = (typeof PROMPT_STYLES)[keyof typeof PROMPT_STYLES];

// 統合型（どちらでも使える）
export type SpellElement = MagicElement | FolkloreAttribute;
export type SpellRarity = TraditionalRarity | FolkloreRarity;

// デフォルト値
export const DEFAULT_ELEMENT: SpellElement = '無';
export const DEFAULT_RARITY_TRADITIONAL: TraditionalRarity = 'common';
export const DEFAULT_RARITY_FOLKLORE: FolkloreRarity = 'Common';
export const DEFAULT_POWER = 5;

// 設定値
export const MAX_POWER = 10;
export const MIN_POWER = 1;
export const MAX_EFFECTS = 3;
