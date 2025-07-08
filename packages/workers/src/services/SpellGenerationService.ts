import { SpellResult, KanjiData } from '@majibattle/shared';
import { KanjiDataManager } from '../data/KanjiDataManager';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class SpellGenerationService {
  private kanjiManager: KanjiDataManager;
  private apiKey: string;
  private model: string;
  private apiEndpoint: string;

  constructor(apiKey: string, model: string) {
    this.kanjiManager = new KanjiDataManager();
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  }

  async generateSpell(selectedKanji: string[]): Promise<SpellResult> {
    if (selectedKanji.length !== 4) {
      throw new Error('Exactly 4 kanji must be selected for spell generation');
    }

    // Get kanji details for context
    const kanjiDetails = selectedKanji
      .map((kanji) => this.kanjiManager.getKanjiData(kanji))
      .filter((detail) => detail !== null) as KanjiData[];

    const prompt = this.createPrompt(kanjiDetails);

    try {
      const response = await this.callGeminiAPI(prompt);
      const spellData = this.parseGeminiResponse(response);

      return {
        ...spellData,
        kanjiUsed: selectedKanji,
        createdAt: new Date(),
      };
    } catch {
      // Fallback to deterministic generation if API fails
      return this.generateFallbackSpell(kanjiDetails);
    }
  }

  private createPrompt(kanjiDetails: KanjiData[]): string {
    const kanjiInfo = kanjiDetails
      .map((k) => `${k.character}（${k.reading}）- ${k.meaning}`)
      .join('、');
    
    const spellName = kanjiDetails.map((k) => k.character).join('');

    return `あなたは創造的な呪文クリエイターです。以下の4つの漢字で表される呪文を使って、独創的で面白い説明を生成してください。

4つの漢字で表される呪文: ${kanjiInfo}

以下のJSON形式で呪文を生成してください:
{
  "spell": "${spellName}",
  "description": "呪文の詳細な説明（どのような効果があるか、どんな場面で使うか）",
  "effects": ["効果1", "効果2", "効果3"],
  "power": 1-10の威力レベル（数値）,
  "element": "属性（火、水、土、風、光、闇、雷、氷、自然、精神、時空、無、弱のいずれか）",
  "rarity": "レアリティ（useless, common、rare、epic、legendaryのいずれか）"
}

重要な指示:
- 選択された漢字を創造的に組み合わせ呪文の説明を生成する
- 説明は100文字以上で魅力的に
- 効果はナンセンスであることを重視し、具体的で面白いものを3つ
- 威力は漢字の組み合わせの相性で決定
- レアリティは呪文の独創性と威力で決定
- 必ず有効なJSONを返すこと`;
  }

  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
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
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1000,
          topK: 40,
          topP: 0.95,
        },
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
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GeminiResponse;
  }

  private parseGeminiResponse(
    response: GeminiResponse
  ): Omit<SpellResult, 'kanjiUsed' | 'createdAt'> {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text;
      if (!text) {
        throw new Error('No response text from Gemini');
      }

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        spell: parsed.spell || '無名の呪文',
        description: parsed.description || '不明な効果',
        effects: Array.isArray(parsed.effects) ? parsed.effects.slice(0, 3) : ['効果不明'],
        power: Math.min(10, Math.max(1, parseInt(parsed.power) || 5)),
        element: this.validateElement(parsed.element),
        rarity: this.validateRarity(parsed.rarity),
      };
    } catch {
      throw new Error('Failed to parse Gemini response');
    }
  }

  private validateElement(element: string): string {
    const validElements = [
      '火',
      '水',
      '土',
      '風',
      '光',
      '闇',
      '雷',
      '氷',
      '自然',
      '精神',
      '時空',
      '無',
      '弱',
    ];
    return validElements.includes(element) ? element : '無';
  }

  private validateRarity(rarity: string): 'useless' | 'common' | 'rare' | 'epic' | 'legendary' {
    const validRarities = ['useless', 'common', 'rare', 'epic', 'legendary'] as const;
    return validRarities.includes(rarity as typeof validRarities[number]) ? (rarity as typeof validRarities[number]) : 'common';
  }

  private generateFallbackSpell(kanjiDetails: KanjiData[]): SpellResult {
    // Deterministic fallback based on kanji properties
    const totalFrequency = kanjiDetails.reduce((sum, k) => sum + k.frequency, 0);
    const avgFrequency = totalFrequency / kanjiDetails.length;

    const power = Math.ceil(avgFrequency / 10);
    const elements = ['火', '水', '土', '風', '光', '闇', '雷', '氷', '弱'];
    const elementIndex = kanjiDetails[0].character.charCodeAt(0) % elements.length;

    let rarity: 'useless' | 'common' | 'rare' | 'epic' | 'legendary' = 'common';
    if (avgFrequency < 30) rarity = 'legendary';
    else if (avgFrequency < 45) rarity = 'epic';
    else if (avgFrequency < 65) rarity = 'rare';
    else if (avgFrequency > 85) rarity = 'useless';

    const spellName = kanjiDetails.map((k) => k.character).join('');

    return {
      spell: spellName,
      description: `${kanjiDetails.map((k) => k.meaning).join('と')}の力を組み合わせた神秘的な呪文。`,
      effects: [
        `${elements[elementIndex]}属性のダメージを与える`,
        `対象の能力を一時的に変化させる`,
        `術者に特殊な加護を与える`,
      ],
      power,
      element: elements[elementIndex],
      rarity,
      kanjiUsed: kanjiDetails.map((k) => k.character),
      createdAt: new Date(),
    };
  }
}
