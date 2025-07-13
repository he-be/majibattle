import { SpellResult, KanjiData } from '@majibattle/shared';
import { KanjiDataManager } from '../data/KanjiDataManager';
import { SpellValidator } from '../utils/SpellValidator';
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

export class SpellGenerationService {
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
    this.validator = new SpellValidator(PROMPT_STYLES.TRADITIONAL);
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

1.  **漢字の概念化**: まず、与えられた4つの漢字（例：「魔」「創」「神」「盾」）を眺め、それぞれの漢字が持つ**概念**や**イメージ**を抽出します。（例：魔→人知を超えた力、邪悪な存在 / 創→何かを生み出すこと / 神→絶対的な存在、奇跡 / 盾→防御、守護）
2.  **物語の創作**: 次に、それらの概念を**物語の構成要素**として扱い、**140文字以内**のショートストーリーを自由に創作してください。**漢字そのものを無理に文章へ組み込む必要はありません。** 例えば「魔創神盾」なら、「神に抗うために魔力を用いて盾を創造した者の物語」や「神々が創造した盾に魔物が封じられている伝承」のように、漢字を物語のテーマとして扱います。
3.  **効果の考案**: あなたが作った物語のテーマに基づき、**全く異なるタイプのナンセンスな効果を3つ**考案してください。毎回同じパターンにならないよう、以下の切り口を参考に発想を飛躍させてください。
    - **五感の変化**: 何かが変な味や匂いに感じられる、幻覚や幻聴が起きる
    - **物理法則の無視**: 特定の物が宙に浮く、影が本体と違う動きをする
    - **行動の強制/制限**: 特定の単語が言えなくなる、奇妙なダンスを踊りだす
    - **ありえない現象**: ポケットから砂金が出てくる、髪型が勝手に変わる
    - **限定的な状況での発動**: 雨の日だけ、満月の夜だけ、特定の食べ物を食べた時だけ発動する
4.  **威力の査定**: 漢字の字面の印象や物語のスケール感を評価し、威力を1～10で決定します。意図的に弱い呪文（威力1～3）も全体の3割程度生成してください。
5.  **属性とレアリティの決定**: 物語の雰囲気から属性を、呪文のくだらなさや面白さの度合いからレアリティを決定します。

# 禁止事項 (Constraints)

- 解説文で、漢字の意味をただ列挙すること。（例：「希望と黒と百と青の力を…」）
- 陳腐な効果の生成。（例：「～ダメージを与える」「能力を変化させる」）

# 良い例 (Good Examples - Multiple Patterns)

### 例1：概念系呪文
- **入力**: \`希黒百青\`
- **物語**: \`百匹の青い蝶が、対象の抱くささやかな希望を嗅ぎつけ、その心をじわりじわりと黒く染め上げていく。青は憂鬱の色、黒は諦観の色である。\`
- **効果**:
    - \`対象が購入する飲み物が、なぜか必ず青汁になる。\`
    - \`今後1週間、希望という言葉を発するたびに、口から黒い煙が少量漏れ出す。\`
    - \`自分の影が、勝手に希望に満ちたポーズを取り続けるようになる。\`

### 例2：日常系呪文
- **入力**: \`焼肉定食\`
- **物語**: \`ジュージューと焼ける肉の幻影が、定められた運命の如く対象の眼前に現れる。それは抗いがたい誘惑の儀式であり、空腹を強制的に最大化させる。\`
- **効果**:
    - \`対象の鼻腔を、今まさに最高に焼けた肉の香りが支配する（効果時間：10分）。\`
    - \`ポケットの中から、なぜか焼肉のタレ（小袋）が一つだけ見つかる。\`
    - \`今後3回、食事の際に「いただきます」と言うと、代わりに「ライスおかわり！」と叫んでしまう。\`

### 例3：神話系呪文
- **入力**: \`魔創神盾\`
- **物語**: \`神々の兵団が振るう光の槍を防ぐため、一人の魔術師が自らの魂を削って創造したとされる伝説の盾。あまりに強固な防御は、時として世界の理さえも拒絶する。\`
- **効果**:
    - \`術者の前方1mに、3秒間だけ透明な壁が出現し、飛んでくる蚊や上司の説教などを物理的にブロックする。\`
    - \`対象が神聖なもの（神棚、教会など）に近づくと、体が勝手に盾を構えるようなポーズをとってしまう。\`
    - \`術者が嘘をついた時、どこからともなく「カーン！」と金属を叩くような音が鳴り響く。\`

# 入力漢字

${kanjiInfo}

# 出力フォーマット (Output Format)

必ず以下のJSON形式で、上記の漢字を使って呪文を生成してください。

{
  "name": "${spellName}",
  "kana": "（呪文のフリガナをカタカナで）",
  "rarity": "（useless, common, rare, epic, legendaryのいずれか）",
  "story": "（あなたが創作した物語風の解説文、140文字以内）",
  "attribute": "（火, 水, 風, 土, 光, 闇, 混沌, 無, 食, 音, 聖, 魔 のいずれか）",
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
        description: this.validator.validateStory(parsed.story || '不明な効果'),
        effects: this.validator.validateEffects(parsed.effects),
        power: this.validator.validatePower(parsed.power),
        element: this.validator.validateElement(parsed.attribute),
        rarity: this.validator.validateRarity(parsed.rarity),
      };
    } catch {
      throw new Error('Failed to parse Gemini response');
    }
  }

  private generateFallbackSpell(kanjiDetails: KanjiData[]): SpellResult {
    // Improved fallback with more creative and nonsensical effects
    // Improved power calculation (intentionally generates more low-power spells)
    const powerSeed =
      kanjiDetails[0].character.charCodeAt(0) + kanjiDetails[1].character.charCodeAt(0);
    const power = Math.min(10, Math.max(1, Math.floor((powerSeed % 10) + 1)));

    const elements = ['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音', '聖', '魔'];
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
      description: this.validator.validateStory(stories[storyIndex]),
      effects,
      power,
      element: elements[elementIndex],
      rarity,
      kanjiUsed: kanjiDetails.map((k) => k.character),
      createdAt: new Date(),
    };
  }
}
