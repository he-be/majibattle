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
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Date;
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
