/**
 * 呪文結果変換アダプター
 * 複数のプロンプトスタイルの結果を統一のSpellResult形式に変換
 */

import { SpellResult, FolkloreSpellResult } from '@majibattle/shared';

export class SpellResultAdapter {
  /**
   * 任意の呪文結果を統一SpellResult形式に変換
   */
  static toUnifiedFormat(result: SpellResult | FolkloreSpellResult): SpellResult {
    // 既にSpellResult形式の場合はそのまま返す
    if ('spell' in result && 'description' in result && 'element' in result) {
      return result as SpellResult;
    }

    // FolkloreSpellResult形式の場合は変換
    const folkloreResult = result as FolkloreSpellResult;

    return {
      // 基本フィールドの変換
      spell: folkloreResult.name,
      description: this.createEnhancedDescription(folkloreResult),
      effects: folkloreResult.effects,
      power: folkloreResult.power,
      element: folkloreResult.attribute,
      rarity: this.normalizeRarity(folkloreResult.rarity),
      createdAt: folkloreResult.createdAt,
      kanjiUsed: folkloreResult.kanjiUsed,

      // 拡張フィールド
      kana: folkloreResult.kana,
      origin: folkloreResult.origin,
    };
  }

  /**
   * 民俗学スタイルの説明文を取得（originは別フィールドで表示するため含めない）
   */
  private static createEnhancedDescription(result: FolkloreSpellResult): string {
    // 由来情報は別途originフィールドで表示するため、storyのみを返す
    return result.story;
  }

  /**
   * レアリティを統一形式に正規化
   */
  private static normalizeRarity(
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
  ):
    | 'useless'
    | 'common'
    | 'rare'
    | 'epic'
    | 'legendary'
    | 'Common'
    | 'Uncommon'
    | 'Rare'
    | 'Epic'
    | 'Legendary' {
    // 民俗学スタイルのレアリティはそのまま保持（フロントエンドで対応済み）
    return rarity;
  }

  /**
   * 呪文結果が民俗学スタイルかどうかを判定
   */
  static isFolkloreStyle(result: SpellResult | FolkloreSpellResult): result is FolkloreSpellResult {
    return 'name' in result && 'story' in result && 'attribute' in result;
  }

  /**
   * 呪文結果が従来スタイルかどうかを判定
   */
  static isTraditionalStyle(result: SpellResult | FolkloreSpellResult): result is SpellResult {
    return 'spell' in result && 'description' in result && 'element' in result;
  }
}
