/**
 * 統合呪文生成サービス
 * 複数のプロンプトスタイルに対応した呪文生成を提供します
 */

import { SpellResult, FolkloreSpellResult, KanjiData } from '@majibattle/shared';
import { KanjiDataManager } from '../data/KanjiDataManager';
import { getPromptTemplate } from '../config/PromptTemplates';
import { SpellValidator } from '../utils/SpellValidator';
import { globalConfig, getCurrentPromptStyle } from '../config/SpellConfig';
import { PROMPT_STYLES } from '../config/SpellConstants';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class UnifiedSpellGenerationService {
  private kanjiManager: KanjiDataManager;
  private apiKey: string;
  private model: string;
  private apiEndpoint: string;
  private validator: SpellValidator;

  constructor(apiKey: string, model: string) {
    this.kanjiManager = new KanjiDataManager();
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // 現在の設定に基づいてバリデーターを初期化
    this.validator = new SpellValidator(getCurrentPromptStyle());
  }

  /**
   * 呪文を生成（スタイルに応じた結果を返す）
   */
  async generateSpell(selectedKanji: string[]): Promise<SpellResult | FolkloreSpellResult> {
    if (selectedKanji.length !== 4) {
      throw new Error('Exactly 4 kanji must be selected for spell generation');
    }

    // 漢字データを取得
    const kanjiDetails = selectedKanji
      .map((kanji) => this.kanjiManager.getKanjiData(kanji))
      .filter((detail) => detail !== null) as KanjiData[];

    const currentStyle = getCurrentPromptStyle();
    this.validator.setStyle(currentStyle);

    // プロンプトテンプレートを取得
    const template = getPromptTemplate(currentStyle);
    const prompt = template.createPrompt(kanjiDetails);

    try {
      // 🔍 検査用: 送信するプロンプトをコンソール出力
      console.log('=== SENDING PROMPT ===');
      console.log(prompt);
      console.log('======================');

      const response = await this.callGeminiAPI(prompt);
      const spellData = this.parseGeminiResponse(response, currentStyle);

      const baseData = {
        kanjiUsed: selectedKanji,
        createdAt: new Date(),
      };

      if (currentStyle === PROMPT_STYLES.TRADITIONAL) {
        return {
          ...spellData,
          ...baseData,
        } as SpellResult;
      } else {
        return {
          ...spellData,
          ...baseData,
        } as FolkloreSpellResult;
      }
    } catch (error) {
      // 🔍 検査用: フォールバック実行の明確な表示
      console.error('🔴 API call failed, using fallback generation:', error);
      console.error('🔴 Error details:', error instanceof Error ? error.message : String(error));
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack available');

      return this.generateFallbackSpell(kanjiDetails, currentStyle);
    }
  }

  /**
   * プロンプトスタイルを変更
   */
  setPromptStyle(style: (typeof PROMPT_STYLES)[keyof typeof PROMPT_STYLES]): void {
    globalConfig.setPromptStyle(style);
    this.validator.setStyle(style);
  }

  /**
   * Gemini API呼び出し
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
    const config = globalConfig.getConfig();

    // 🔍 検査用: API Key の状態を確認
    console.log('🔍 API Key check:');
    console.log('- API Key exists:', !!this.apiKey);
    console.log('- API Key length:', this.apiKey?.length || 0);
    console.log('- API Key first 10 chars:', this.apiKey?.substring(0, 10) || 'undefined');
    console.log('- API Endpoint:', this.apiEndpoint);

    const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: config.apiSettings,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    if (!response.ok) {
      // 🔍 検査用: API エラーの詳細をログ出力
      console.error('🔴 Gemini API Error Details:');
      console.error('- Status:', response.status);
      console.error('- Status Text:', response.statusText);
      console.error('- Response Headers:', Object.fromEntries(response.headers.entries()));

      try {
        const errorBody = await response.text();
        console.error('- Error Body:', errorBody);
      } catch (e) {
        console.error('- Could not read error body:', e);
      }

      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GeminiResponse;
  }

  /**
   * Geminiレスポンスのパース（スタイル対応）
   */
  private parseGeminiResponse(
    response: GeminiResponse,
    style: (typeof PROMPT_STYLES)[keyof typeof PROMPT_STYLES]
  ): Omit<SpellResult | FolkloreSpellResult, 'kanjiUsed' | 'createdAt'> {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text;
      if (!text) {
        throw new Error('No response text from Gemini');
      }

      // 🔍 検査用: Geminiの生レスポンスをコンソール出力
      console.log('=== GEMINI RAW RESPONSE ===');
      console.log('Full text response:', text);
      console.log('============================');

      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 🔍 検査用: パースされたJSONをコンソール出力
      console.log('=== PARSED JSON ===');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('===================');

      if (style === PROMPT_STYLES.TRADITIONAL) {
        return {
          spell: parsed.name || '無名の呪文',
          description: parsed.story || '不明な効果',
          effects: this.validator.validateEffects(parsed.effects),
          power: this.validator.validatePower(parsed.power),
          element: this.validator.validateElement(parsed.attribute),
          rarity: this.validator.validateRarity(parsed.rarity),
        } as Omit<SpellResult, 'kanjiUsed' | 'createdAt'>;
      } else {
        return {
          name: parsed.name || '無名の呪い',
          kana: parsed.kana || 'ムメイノノロイ',
          story: parsed.story || '不明な背景',
          origin: parsed.origin || '由来不明',
          effects: this.validator.validateEffects(parsed.effects),
          power: this.validator.validatePower(parsed.power),
          attribute: this.validator.validateElement(parsed.attribute),
          rarity: this.validator.validateRarity(parsed.rarity),
        } as Omit<FolkloreSpellResult, 'kanjiUsed' | 'createdAt'>;
      }
    } catch (error) {
      console.warn('Failed to parse Gemini response:', error);
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * フォールバック呪文生成（スタイル対応）
   */
  private generateFallbackSpell(
    kanjiDetails: KanjiData[],
    style: (typeof PROMPT_STYLES)[keyof typeof PROMPT_STYLES]
  ): SpellResult | FolkloreSpellResult {
    const powerSeed =
      kanjiDetails[0].character.charCodeAt(0) + kanjiDetails[1].character.charCodeAt(0);
    const power = Math.min(10, Math.max(1, Math.floor((powerSeed % 10) + 1)));

    const validElements = this.validator.getValidElements();
    const elementIndex = powerSeed % validElements.length;
    const element = validElements[elementIndex];

    const validRarities = this.validator.getValidRarities();
    let rarityIndex = 1; // common/Common
    if (power <= 2)
      rarityIndex = 0; // useless/Common
    else if (power <= 4)
      rarityIndex = 1; // common/Uncommon
    else if (power <= 6)
      rarityIndex = 2; // rare/Rare
    else if (power <= 8)
      rarityIndex = 3; // epic/Epic
    else rarityIndex = 4; // legendary/Legendary

    const rarity = validRarities[Math.min(rarityIndex, validRarities.length - 1)];
    const spellName = kanjiDetails.map((k) => k.character).join('');

    const baseData = {
      power,
      kanjiUsed: kanjiDetails.map((k) => k.character),
      createdAt: new Date(),
    };

    if (style === PROMPT_STYLES.TRADITIONAL) {
      return {
        spell: spellName,
        description: `${kanjiDetails.map((k) => k.meaning).join('の精霊が')}と踊り狂う奇妙な呪文。`,
        effects: [
          `術者の${kanjiDetails[0].meaning}が${kanjiDetails[1].meaning}の色に変わり、周囲の人を困惑させる`,
          `対象の${kanjiDetails[2].meaning}に関する記憶が${kanjiDetails[3].meaning}に置き換わる（1時間）`,
          `半径5mの範囲で${kanjiDetails[0].meaning}という単語が${kanjiDetails[1].meaning}に聞こえるようになる`,
        ],
        element,
        rarity,
        ...baseData,
      } as SpellResult;
    } else {
      return {
        name: spellName,
        kana: kanjiDetails.map((k) => this.convertToKatakana(k.reading)).join(''),
        story: `古来より${kanjiDetails[0].meaning}を司る村で、${kanjiDetails[1].meaning}の力を借りて${kanjiDetails[2].meaning}を成就させるために生まれた呪い。`,
        origin: `ある村人が${kanjiDetails[3].meaning}への執着から、この呪いを過度に使用した結果、意図しない奇妙な現象を引き起こすようになったと伝えられている。`,
        effects: [
          `術者の周囲で${kanjiDetails[0].meaning}に関連する物が、一日一度、微妙に位置を変える`,
          `${kanjiDetails[1].meaning}という言葉を聞くたび、術者の手に${kanjiDetails[2].meaning}の感触が蘇る`,
          `満月の夜、術者の影が${kanjiDetails[3].meaning}の形を模倣するような動きを見せる`,
        ],
        attribute: element,
        rarity,
        ...baseData,
      } as FolkloreSpellResult;
    }
  }

  /**
   * ひらがな読みをカタカナに変換（簡易版）
   */
  private convertToKatakana(hiragana: string): string {
    return hiragana.replace(/[\u3041-\u3096]/g, function (match) {
      return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
  }
}
