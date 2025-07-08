export interface GameSessionState {
  currentKanji: string[];
  selectedKanji: string[];
  spellHistory: SpellResult[];
  sessionId: string;
  createdAt: Date;
  lastUpdatedAt: Date;
}

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
