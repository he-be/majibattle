export interface GameSessionState {
  currentKanji: string[];
  selectedKanji: string[];
  spellHistory: SpellResult[];
  sessionId: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

// 従来の呪文結果（魔法系）
export interface SpellResult {
  spell: string;
  description: string;
  effects: string[];
  power: number;
  element: string;
  rarity: 'useless' | 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Date;
  kanjiUsed: string[]; // 使用した漢字の記録
}

// 新しい民俗学スタイルの呪文結果
export interface FolkloreSpellResult {
  name: string; // 従来のspell
  kana: string; // カタカナ読み
  story: string; // 背景物語（従来のdescription）
  origin: string; // 由来・伝承（新規）
  effects: string[]; // 観測された現象
  power: number; // 危険度
  attribute: string; // 民俗学的分類（従来のelement）
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  createdAt: Date;
  kanjiUsed: string[];
}

// 統合型（どちらでも使える）
export type UnifiedSpellResult = SpellResult | FolkloreSpellResult;

export interface SpellGenerationRequest {
  selectedKanji: string[];
  sessionId: string;
}

export interface SpellGenerationResponse extends APIResponse<SpellResult> {
  cached?: boolean; // キャッシュからの応答かどうか
}

export interface KanjiData {
  character: string;
  reading: string;
  meaning: string;
  frequency: number;
  category: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
