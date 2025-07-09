/**
 * 呪文生成システムの設定管理
 * プロンプトスタイルの切り替えやその他の設定を管理します
 */

import { PROMPT_STYLES, type PromptStyle } from './SpellConstants';

export interface SpellConfig {
  promptStyle: PromptStyle;
  apiSettings: {
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
  };
  fallbackSettings: {
    enabled: boolean;
    useCreativeEffects: boolean;
  };
}

// デフォルト設定
export const DEFAULT_CONFIG: SpellConfig = {
  promptStyle: PROMPT_STYLES.FOLKLORE, // 新しい民俗学スタイルをデフォルトに
  apiSettings: {
    temperature: 0.9,
    maxOutputTokens: 1500, // 新しいスタイルでは出力が長いため増加
    topK: 40,
    topP: 0.95,
  },
  fallbackSettings: {
    enabled: true,
    useCreativeEffects: true,
  },
};

// 環境変数や外部設定からの読み込み
export class ConfigManager {
  private config: SpellConfig;

  constructor(initialConfig: Partial<SpellConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...initialConfig,
      apiSettings: {
        ...DEFAULT_CONFIG.apiSettings,
        ...initialConfig.apiSettings,
      },
      fallbackSettings: {
        ...DEFAULT_CONFIG.fallbackSettings,
        ...initialConfig.fallbackSettings,
      },
    };
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): SpellConfig {
    return { ...this.config };
  }

  /**
   * プロンプトスタイルを設定
   */
  setPromptStyle(style: PromptStyle): void {
    this.config.promptStyle = style;
  }

  /**
   * プロンプトスタイルを取得
   */
  getPromptStyle(): PromptStyle {
    return this.config.promptStyle;
  }

  /**
   * API設定を更新
   */
  updateApiSettings(settings: Partial<SpellConfig['apiSettings']>): void {
    this.config.apiSettings = {
      ...this.config.apiSettings,
      ...settings,
    };
  }

  /**
   * フォールバック設定を更新
   */
  updateFallbackSettings(settings: Partial<SpellConfig['fallbackSettings']>): void {
    this.config.fallbackSettings = {
      ...this.config.fallbackSettings,
      ...settings,
    };
  }

  /**
   * 設定をリセット
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 環境変数から設定を読み込み
   */
  loadFromEnvironment(): void {
    // 環境変数 SPELL_PROMPT_STYLE があれば使用
    const envPromptStyle = process.env.SPELL_PROMPT_STYLE;
    if (envPromptStyle && Object.values(PROMPT_STYLES).includes(envPromptStyle as PromptStyle)) {
      this.setPromptStyle(envPromptStyle as PromptStyle);
    }

    // その他の環境変数も必要に応じて読み込み
    if (process.env.SPELL_TEMPERATURE) {
      const temp = parseFloat(process.env.SPELL_TEMPERATURE);
      if (!isNaN(temp)) {
        this.updateApiSettings({ temperature: temp });
      }
    }
  }
}

// グローバル設定インスタンス
export const globalConfig = new ConfigManager();

// 環境変数から初期設定を読み込み
globalConfig.loadFromEnvironment();

// 便利関数
export const getCurrentPromptStyle = (): PromptStyle => {
  return globalConfig.getPromptStyle();
};

export const setGlobalPromptStyle = (style: PromptStyle): void => {
  globalConfig.setPromptStyle(style);
};
