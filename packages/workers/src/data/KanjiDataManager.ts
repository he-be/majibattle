import { KanjiData } from '@majibattle/shared';

export class KanjiDataManager {
  private kanjiDatabase: KanjiData[] = [];
  private categorizedKanji: Map<string, KanjiData[]> = new Map();

  constructor() {
    this.initializeKanjiDatabase();
    this.categorizeKanji();
  }

  /**
   * 漢字データベースを初期化
   * 常用漢字を中心に、呪文として面白い組み合わせを考慮
   */
  private initializeKanjiDatabase(): void {
    this.kanjiDatabase = [
      // 自然・元素系
      { character: '火', reading: 'か', meaning: '火', frequency: 95, category: '自然' },
      { character: '水', reading: 'すい', meaning: '水', frequency: 90, category: '自然' },
      { character: '木', reading: 'き', meaning: '木', frequency: 85, category: '自然' },
      { character: '金', reading: 'きん', meaning: '金', frequency: 80, category: '自然' },
      { character: '土', reading: 'つち', meaning: '土', frequency: 75, category: '自然' },
      { character: '光', reading: 'ひかり', meaning: '光', frequency: 70, category: '自然' },
      { character: '闇', reading: 'やみ', meaning: '闇', frequency: 65, category: '自然' },
      { character: '風', reading: 'かぜ', meaning: '風', frequency: 85, category: '自然' },
      { character: '雷', reading: 'かみなり', meaning: '雷', frequency: 60, category: '自然' },
      { character: '氷', reading: 'こおり', meaning: '氷', frequency: 55, category: '自然' },
      { character: '雲', reading: 'くも', meaning: '雲', frequency: 50, category: '自然' },
      { character: '星', reading: 'ほし', meaning: '星', frequency: 65, category: '自然' },
      { character: '月', reading: 'つき', meaning: '月', frequency: 70, category: '自然' },
      { character: '太', reading: 'たい', meaning: '太い', frequency: 60, category: '自然' },
      { character: '空', reading: 'そら', meaning: '空', frequency: 75, category: '自然' },

      // 戦闘・武器系
      { character: '剣', reading: 'けん', meaning: '剣', frequency: 40, category: '武器' },
      { character: '盾', reading: 'たて', meaning: '盾', frequency: 35, category: '武器' },
      { character: '槍', reading: 'やり', meaning: '槍', frequency: 30, category: '武器' },
      { character: '弓', reading: 'ゆみ', meaning: '弓', frequency: 45, category: '武器' },
      { character: '鎧', reading: 'よろい', meaning: '鎧', frequency: 25, category: '武器' },
      { character: '刀', reading: 'かたな', meaning: '刀', frequency: 50, category: '武器' },
      { character: '矢', reading: 'や', meaning: '矢', frequency: 40, category: '武器' },

      // 魔法・呪文系
      { character: '魔', reading: 'ま', meaning: '魔法', frequency: 45, category: '魔法' },
      { character: '法', reading: 'ほう', meaning: '法', frequency: 60, category: '魔法' },
      { character: '術', reading: 'じゅつ', meaning: '術', frequency: 55, category: '魔法' },
      { character: '呪', reading: 'のろい', meaning: '呪い', frequency: 30, category: '魔法' },
      { character: '霊', reading: 'れい', meaning: '霊', frequency: 40, category: '魔法' },
      { character: '神', reading: 'かみ', meaning: '神', frequency: 70, category: '魔法' },
      { character: '聖', reading: 'せい', meaning: '聖', frequency: 50, category: '魔法' },
      { character: '召', reading: 'しょう', meaning: '召す', frequency: 35, category: '魔法' },
      { character: '封', reading: 'ふう', meaning: '封じる', frequency: 40, category: '魔法' },

      // 動作・状態系
      { character: '攻', reading: 'こう', meaning: '攻撃', frequency: 65, category: '動作' },
      { character: '守', reading: 'しゅ', meaning: '守る', frequency: 70, category: '動作' },
      { character: '癒', reading: 'いやし', meaning: '癒す', frequency: 45, category: '動作' },
      { character: '破', reading: 'は', meaning: '破る', frequency: 60, category: '動作' },
      { character: '創', reading: 'そう', meaning: '創る', frequency: 55, category: '動作' },
      { character: '変', reading: 'へん', meaning: '変える', frequency: 75, category: '動作' },
      { character: '移', reading: 'い', meaning: '移る', frequency: 65, category: '動作' },
      { character: '飛', reading: 'ひ', meaning: '飛ぶ', frequency: 70, category: '動作' },
      { character: '跳', reading: 'ちょう', meaning: '跳ぶ', frequency: 45, category: '動作' },
      { character: '走', reading: 'そう', meaning: '走る', frequency: 60, category: '動作' },

      // 感情・状態系
      { character: '怒', reading: 'いかり', meaning: '怒り', frequency: 50, category: '感情' },
      { character: '喜', reading: 'よろこび', meaning: '喜び', frequency: 55, category: '感情' },
      { character: '悲', reading: 'かなしみ', meaning: '悲しみ', frequency: 45, category: '感情' },
      { character: '恐', reading: 'きょう', meaning: '恐怖', frequency: 40, category: '感情' },
      { character: '愛', reading: 'あい', meaning: '愛', frequency: 80, category: '感情' },
      { character: '憎', reading: 'にくしみ', meaning: '憎しみ', frequency: 35, category: '感情' },
      { character: '希', reading: 'き', meaning: '希望', frequency: 60, category: '感情' },
      { character: '絶', reading: 'ぜつ', meaning: '絶望', frequency: 40, category: '感情' },

      // 色・属性系
      { character: '赤', reading: 'あか', meaning: '赤', frequency: 70, category: '色' },
      { character: '青', reading: 'あお', meaning: '青', frequency: 75, category: '色' },
      { character: '白', reading: 'しろ', meaning: '白', frequency: 80, category: '色' },
      { character: '黒', reading: 'くろ', meaning: '黒', frequency: 85, category: '色' },
      { character: '緑', reading: 'みどり', meaning: '緑', frequency: 65, category: '色' },
      { character: '紫', reading: 'むらさき', meaning: '紫', frequency: 45, category: '色' },
      { character: '黄', reading: 'き', meaning: '黄', frequency: 60, category: '色' },
      { character: '金', reading: 'きん', meaning: '金色', frequency: 55, category: '色' },
      { character: '銀', reading: 'ぎん', meaning: '銀色', frequency: 50, category: '色' },

      // 数・量系
      { character: '一', reading: 'いち', meaning: '一', frequency: 95, category: '数' },
      { character: '二', reading: 'に', meaning: '二', frequency: 90, category: '数' },
      { character: '三', reading: 'さん', meaning: '三', frequency: 85, category: '数' },
      { character: '四', reading: 'し', meaning: '四', frequency: 80, category: '数' },
      { character: '五', reading: 'ご', meaning: '五', frequency: 75, category: '数' },
      { character: '六', reading: 'ろく', meaning: '六', frequency: 70, category: '数' },
      { character: '七', reading: 'なな', meaning: '七', frequency: 65, category: '数' },
      { character: '八', reading: 'はち', meaning: '八', frequency: 60, category: '数' },
      { character: '九', reading: 'きゅう', meaning: '九', frequency: 55, category: '数' },
      { character: '十', reading: 'じゅう', meaning: '十', frequency: 85, category: '数' },
      { character: '百', reading: 'ひゃく', meaning: '百', frequency: 65, category: '数' },
      { character: '千', reading: 'せん', meaning: '千', frequency: 60, category: '数' },
      { character: '万', reading: 'まん', meaning: '万', frequency: 70, category: '数' },

      // 動物・生物系
      { character: '龍', reading: 'りゅう', meaning: '龍', frequency: 25, category: '生物' },
      { character: '虎', reading: 'とら', meaning: '虎', frequency: 40, category: '生物' },
      { character: '鷹', reading: 'たか', meaning: '鷹', frequency: 35, category: '生物' },
      { character: '狼', reading: 'おおかみ', meaning: '狼', frequency: 30, category: '生物' },
      { character: '蛇', reading: 'へび', meaning: '蛇', frequency: 45, category: '生物' },
      { character: '鳥', reading: 'とり', meaning: '鳥', frequency: 60, category: '生物' },
      { character: '魚', reading: 'さかな', meaning: '魚', frequency: 65, category: '生物' },
      { character: '馬', reading: 'うま', meaning: '馬', frequency: 55, category: '生物' },
      { character: '犬', reading: 'いぬ', meaning: '犬', frequency: 70, category: '生物' },
      { character: '猫', reading: 'ねこ', meaning: '猫', frequency: 75, category: '生物' },
      { character: '豚', reading: 'ぶた', meaning: '豚', frequency: 50, category: '生物' },
      { character: '牛', reading: 'うし', meaning: '牛', frequency: 60, category: '生物' },
      { character: '羊', reading: 'ひつじ', meaning: '羊', frequency: 45, category: '生物' },
      { character: '蟻', reading: 'あり', meaning: '蟻', frequency: 40, category: '生物' },
      { character: '蚊', reading: 'か', meaning: '蚊', frequency: 50, category: '生物' },
      { character: '蝿', reading: 'はえ', meaning: '蝿', frequency: 35, category: '生物' },

      // 弱そう・ネガティブ系
      { character: '負', reading: 'ふ', meaning: '負ける', frequency: 65, category: '弱い' },
      { character: '倒', reading: 'とう', meaning: '倒れる', frequency: 60, category: '弱い' },
      { character: '不', reading: 'ふ', meaning: '不', frequency: 75, category: '弱い' },
      { character: '弱', reading: 'よわい', meaning: '弱い', frequency: 70, category: '弱い' },
      { character: '病', reading: 'やまい', meaning: '病気', frequency: 55, category: '弱い' },
      { character: '死', reading: 'し', meaning: '死', frequency: 60, category: '弱い' },
      { character: '失', reading: 'しつ', meaning: '失う', frequency: 65, category: '弱い' },
      { character: '落', reading: 'らく', meaning: '落ちる', frequency: 70, category: '弱い' },
      { character: '折', reading: 'おれる', meaning: '折れる', frequency: 50, category: '弱い' },
      { character: '涙', reading: 'なみだ', meaning: '涙', frequency: 55, category: '弱い' },
      { character: '泣', reading: 'なく', meaning: '泣く', frequency: 60, category: '弱い' },
      { character: '痛', reading: 'いたい', meaning: '痛い', frequency: 65, category: '弱い' },
      { character: '困', reading: 'こまる', meaning: '困る', frequency: 70, category: '弱い' },
      { character: '疲', reading: 'つかれる', meaning: '疲れる', frequency: 55, category: '弱い' },
      { character: '眠', reading: 'ねむい', meaning: '眠い', frequency: 60, category: '弱い' },
      { character: '寒', reading: 'さむい', meaning: '寒い', frequency: 65, category: '弱い' },
      { character: '暗', reading: 'くらい', meaning: '暗い', frequency: 70, category: '弱い' },
      { character: '小', reading: 'ちいさい', meaning: '小さい', frequency: 85, category: '弱い' },
      { character: '薄', reading: 'うすい', meaning: '薄い', frequency: 50, category: '弱い' },
      { character: '軽', reading: 'かるい', meaning: '軽い', frequency: 60, category: '弱い' },

      // 日常・普通系
      { character: '飯', reading: 'めし', meaning: '飯', frequency: 60, category: '日常' },
      { character: '茶', reading: 'ちゃ', meaning: '茶', frequency: 65, category: '日常' },
      { character: '湯', reading: 'ゆ', meaning: '湯', frequency: 55, category: '日常' },
      { character: '塩', reading: 'しお', meaning: '塩', frequency: 50, category: '日常' },
      { character: '糖', reading: 'とう', meaning: '糖', frequency: 45, category: '日常' },
      { character: '紙', reading: 'かみ', meaning: '紙', frequency: 70, category: '日常' },
      { character: '布', reading: 'ぬの', meaning: '布', frequency: 55, category: '日常' },
      { character: '石', reading: 'いし', meaning: '石', frequency: 75, category: '日常' },
      { character: '草', reading: 'くさ', meaning: '草', frequency: 70, category: '日常' },
      { character: '花', reading: 'はな', meaning: '花', frequency: 80, category: '日常' },
      { character: '葉', reading: 'は', meaning: '葉', frequency: 65, category: '日常' },
      { character: '根', reading: 'ね', meaning: '根', frequency: 60, category: '日常' },
    ];
  }

  /**
   * 漢字をカテゴリ別に分類
   */
  private categorizeKanji(): void {
    this.categorizedKanji.clear();

    for (const kanji of this.kanjiDatabase) {
      if (!this.categorizedKanji.has(kanji.category)) {
        this.categorizedKanji.set(kanji.category, []);
      }
      this.categorizedKanji.get(kanji.category)!.push(kanji);
    }
  }

  /**
   * ランダムに漢字20個を選択
   * バランスの取れた文字選択（頻度・カテゴリ考慮）
   */
  public generateRandomKanji(count: number = 20): string[] {
    if (count > this.kanjiDatabase.length) {
      throw new Error(
        `Cannot generate ${count} kanji. Database only contains ${this.kanjiDatabase.length} kanji.`
      );
    }

    // 重み付き選択用の配列を作成
    const weightedKanji: KanjiData[] = [];

    for (const kanji of this.kanjiDatabase) {
      // 頻度に基づいて重みを設定（頻度が高いほど選ばれやすい）
      const weight = Math.floor(kanji.frequency / 10) + 1;
      for (let i = 0; i < weight; i++) {
        weightedKanji.push(kanji);
      }
    }

    // カテゴリバランスを考慮した選択
    const selectedKanji = new Set<string>();
    const categoryUsageCount = new Map<string, number>();

    // 各カテゴリから最低1個は選択
    for (const [category, kanjiList] of this.categorizedKanji) {
      if (selectedKanji.size >= count) break;

      const randomKanji = kanjiList[Math.floor(Math.random() * kanjiList.length)];
      selectedKanji.add(randomKanji.character);
      categoryUsageCount.set(category, 1);
    }

    // 残りをランダムで選択
    while (selectedKanji.size < count) {
      const randomKanji = weightedKanji[Math.floor(Math.random() * weightedKanji.length)];

      // 重複チェック
      if (selectedKanji.has(randomKanji.character)) {
        continue;
      }

      // カテゴリバランスチェック（同じカテゴリから4個以上選ばない）
      const categoryCount = categoryUsageCount.get(randomKanji.category) || 0;
      if (categoryCount >= 4) {
        continue;
      }

      selectedKanji.add(randomKanji.character);
      categoryUsageCount.set(randomKanji.category, categoryCount + 1);
    }

    return Array.from(selectedKanji);
  }

  /**
   * 指定された漢字の詳細情報を取得
   */
  public getKanjiData(character: string): KanjiData | null {
    return this.kanjiDatabase.find((k) => k.character === character) || null;
  }

  /**
   * カテゴリ別に漢字を取得
   */
  public getKanjiByCategory(category: string): KanjiData[] {
    return this.categorizedKanji.get(category) || [];
  }

  /**
   * 利用可能なカテゴリ一覧を取得
   */
  public getAvailableCategories(): string[] {
    return Array.from(this.categorizedKanji.keys());
  }

  /**
   * 漢字データベースのサイズを取得
   */
  public getDatabaseSize(): number {
    return this.kanjiDatabase.length;
  }

  /**
   * 漢字の検索（部分一致）
   */
  public searchKanji(query: string): KanjiData[] {
    const lowerQuery = query.toLowerCase();
    // カタカナをひらがなに変換
    const hiraganaQuery = this.katakanaToHiragana(query);

    return this.kanjiDatabase.filter(
      (kanji) =>
        kanji.character.includes(query) ||
        kanji.reading.includes(lowerQuery) ||
        kanji.reading.includes(hiraganaQuery) ||
        kanji.meaning.includes(query) ||
        kanji.category.includes(query)
    );
  }

  /**
   * カタカナをひらがなに変換
   */
  private katakanaToHiragana(str: string): string {
    return str.replace(/[\u30A1-\u30F6]/g, function (match) {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  }

  /**
   * 重複チェック機能
   */
  public validateKanjiSelection(selectedKanji: string[]): boolean {
    const uniqueKanji = new Set(selectedKanji);
    return uniqueKanji.size === selectedKanji.length;
  }

  /**
   * 漢字組み合わせの妥当性チェック
   */
  public validateKanjiCombination(kanjiList: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 重複チェック
    if (!this.validateKanjiSelection(kanjiList)) {
      errors.push('重複した漢字が含まれています');
    }

    // 長さチェック
    if (kanjiList.length > 4) {
      errors.push('漢字は最大4文字までです');
    }

    // 存在チェック
    for (const kanji of kanjiList) {
      if (!this.getKanjiData(kanji)) {
        errors.push(`漢字「${kanji}」がデータベースに存在しません`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
