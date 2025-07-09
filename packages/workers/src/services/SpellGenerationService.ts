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

    return `# 役割 (Role)

あなたは『くだらないけど面白い呪文』を生成する、ユーモアと混沌を愛する大魔道士です。あなたの使命は、与えられた4つの漢字から、誰もが思わず笑ってしまうような、奇妙で、時には全く役に立たない呪文を考え出すことです。常識や既存のファンタジーの枠にとらわれず、自由な発想で呪文を創造してください。

# 思考プロセス (Thinking Process)

1.  **漢字の分解と妄想**: まず、与えられた4つの漢字を一つずつ眺め、それぞれの漢字が持つ意味や形から連想されるイメージを自由に、そして突拍子もなく広げてください。
2.  **物語の創造**: 次に、それらのイメージを無理やり繋ぎ合わせ、一つの奇妙で壮大な、あるいは非常にくだらないショートストーリーを創作します。これが呪文の**解説文**になります。
3.  **効果の抽出**: あなたが作った物語の中から、具体的でナンセンスな**効果**を3つ抽出してください。効果は、戦闘の役に立つ必要は全くありません。むしろ、日常で少し困るような、意味不明な現象を引き起こすものを歓迎します。
4.  **威力の査定**: 漢字の字面の「強そう/弱そう」な印象や、あなたが創作した物語のスケール感を総合的に評価し、**威力**を1から10の10段階で決定します。**重要なのは、意図的に弱い呪文（威力1～3）も全体の3割程度生成することです。** 全ての呪文が強力である必要はありません。
5.  **属性とレアリティの決定**: 物語と効果の雰囲気から**属性**を、呪文のくだらなさや面白さの度合いから**レアリティ**を決定してください。

# 禁止事項 (Constraints)

以下のテンプレート的で退屈な表現は**絶対に**使用しないでください。
- 「～属性のダメージを与える」
- 「対象の能力を一時的に（永続的に）変化させる/上げる/下げる」
- 「術者に特殊な加護を与える/状態異常を付与する」
- 解説文で、漢字の意味をただ列挙すること。（例：「希望と黒と百と青の力を…」）

# 良い例 (Good Example)

- **入力漢字**: \`希黒百青\`
- **良い物語**: \`百匹の青い虫が対象のわずかな希望すら見つけ出し、その心を真っ黒に塗りつ潰していく。\`
- **良い効果**:
    - \`対象が食べている物がすべて青色に見え、食欲を著しく減退させる。\`
    - \`術者の脳内で、なぜか希望という単語が「絶望」に自動変換されるようになる（24時間）。\`
    - \`周囲10mの空間で「希望」と名のつく楽曲の再生を妨害する。\`
- **威力**: \`2\` (一見強そうだが、実用性がないため)

# 入力漢字

${kanjiInfo}

# 出力フォーマット (Output Format)

必ず以下のJSON形式で、上記の漢字を使って呪文を生成してください。

{
  "name": "${spellName}",
  "kana": "（呪文のフリガナをカタカナで）",
  "rarity": "（common, rare, epic, legendaryのいずれか）",
  "story": "（あなたが創作した物語風の解説文）",
  "attribute": "（火, 水, 風, 土, 光, 闇, 混沌, 無, 食, 音 のいずれか）",
  "power": （1から10の整数）,
  "effects": [
    "（具体的でナンセンスな効果1）",
    "（具体的でナンセンスな効果2）",
    "（具体的でナンセンスな効果3）"
  ]
}`;
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
        spell: parsed.name || '無名の呪文',
        description: parsed.story || '不明な効果',
        effects: Array.isArray(parsed.effects) ? parsed.effects.slice(0, 3) : ['効果不明'],
        power: Math.min(10, Math.max(1, parseInt(parsed.power) || 5)),
        element: this.validateElement(parsed.attribute),
        rarity: this.validateRarity(parsed.rarity),
      };
    } catch {
      throw new Error('Failed to parse Gemini response');
    }
  }

  private validateElement(element: string): string {
    const validElements = ['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音'];
    return validElements.includes(element) ? element : '無';
  }

  private validateRarity(rarity: string): 'useless' | 'common' | 'rare' | 'epic' | 'legendary' {
    const validRarities = ['useless', 'common', 'rare', 'epic', 'legendary'] as const;
    return validRarities.includes(rarity as (typeof validRarities)[number])
      ? (rarity as (typeof validRarities)[number])
      : 'common';
  }

  private generateFallbackSpell(kanjiDetails: KanjiData[]): SpellResult {
    // Improved fallback with more creative and nonsensical effects
    // Improved power calculation (intentionally generates more low-power spells)
    const powerSeed =
      kanjiDetails[0].character.charCodeAt(0) + kanjiDetails[1].character.charCodeAt(0);
    const power = Math.min(10, Math.max(1, Math.floor((powerSeed % 10) + 1)));

    const elements = ['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音'];
    const elementIndex = powerSeed % elements.length;

    let rarity: 'useless' | 'common' | 'rare' | 'epic' | 'legendary' = 'common';
    if (power <= 2) rarity = 'useless';
    else if (power <= 4) rarity = 'common';
    else if (power <= 6) rarity = 'rare';
    else if (power <= 8) rarity = 'epic';
    else rarity = 'legendary';

    const spellName = kanjiDetails.map((k) => k.character).join('');

    // Create nonsensical story-based description
    const stories = [
      `${kanjiDetails[0].meaning}の精霊が${kanjiDetails[1].meaning}を求めて彷徨い、${kanjiDetails[2].meaning}の中で${kanjiDetails[3].meaning}と踊り狂う。`,
      `${kanjiDetails[0].meaning}が突然${kanjiDetails[1].meaning}に変化し、${kanjiDetails[2].meaning}の上で${kanjiDetails[3].meaning}を奏でる。`,
      `${kanjiDetails[0].meaning}の神が${kanjiDetails[1].meaning}を呪文に込め、${kanjiDetails[2].meaning}の力で${kanjiDetails[3].meaning}を操る。`,
    ];
    const storyIndex = powerSeed % stories.length;

    // Nonsensical effects based on kanji meanings
    const effectTemplates = [
      `術者の${kanjiDetails[0].meaning}が${kanjiDetails[1].meaning}の色に変わり、周囲の人を困惑させる`,
      `対象の${kanjiDetails[2].meaning}に関する記憶が${kanjiDetails[3].meaning}に置き換わる（1時間）`,
      `半径5mの範囲で${kanjiDetails[0].meaning}という単語が${kanjiDetails[1].meaning}に聞こえるようになる`,
      `術者が${kanjiDetails[2].meaning}について話すたびに、なぜか${kanjiDetails[3].meaning}の匂いがする`,
      `対象の影が${kanjiDetails[0].meaning}の形になり、${kanjiDetails[1].meaning}のような動きをする`,
    ];

    const effects = [];
    for (let i = 0; i < 3; i++) {
      const effectIndex = (powerSeed + i) % effectTemplates.length;
      effects.push(effectTemplates[effectIndex]);
    }

    return {
      spell: spellName,
      description: stories[storyIndex],
      effects,
      power,
      element: elements[elementIndex],
      rarity,
      kanjiUsed: kanjiDetails.map((k) => k.character),
      createdAt: new Date(),
    };
  }
}
