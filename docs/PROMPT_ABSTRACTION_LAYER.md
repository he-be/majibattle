# プロンプト抽象化レイヤー

## 概要

このドキュメントは、MajiBattleプロジェクトにおけるプロンプト抽象化レイヤーの設計と使用方法について説明します。

## 背景

従来のSpellGenerationServiceは、単一のプロンプトスタイルに依存していました。新しいプロンプトスタイルを追加する際、すべてのテストやバリデーションを作り直す必要があり、保守性に問題がありました。

## 設計目標

1. **プロンプトスタイルの抽象化**: 複数のプロンプトスタイルを簡単に切り替えられる
2. **属性・レアリティの動的管理**: 新しい属性やレアリティを追加しても、テストが自動的に対応
3. **型安全性**: TypeScriptの型システムを活用した安全な実装
4. **テストの統一**: 単一のテストセットで複数のスタイルをテスト可能

## アーキテクチャ

### 1. 定数管理 (`SpellConstants.ts`)

```typescript
// 魔法系属性（従来）
export const MAGIC_ELEMENTS = ['火', '水', '風', '土', '光', '闇', '混沌', '無', '食', '音', '聖', '魔'];

// 民俗学的属性（新規）
export const FOLKLORE_ATTRIBUTES = ['五穀豊穣', '厄除け', '恋愛成就', '雨乞い', '神隠し', '禁忌'];

// プロンプトスタイル
export const PROMPT_STYLES = {
  TRADITIONAL: 'traditional',
  FOLKLORE: 'folklore',
} as const;
```

### 2. プロンプトテンプレート (`PromptTemplates.ts`)

```typescript
export interface PromptTemplate {
  createPrompt: (kanjiDetails: KanjiData[]) => string;
  style: PromptStyle;
  description: string;
}

export const PROMPT_TEMPLATES: Record<PromptStyle, PromptTemplate> = {
  [PROMPT_STYLES.TRADITIONAL]: traditionalPrompt,
  [PROMPT_STYLES.FOLKLORE]: folklorePrompt,
};
```

### 3. 動的バリデーション (`SpellValidator.ts`)

```typescript
export class SpellValidator {
  constructor(private style: PromptStyle) {}
  
  validateElement(element: string): SpellElement {
    // スタイルに応じて適切な属性バリデーションを実行
  }
  
  validateRarity(rarity: string): SpellRarity {
    // スタイルに応じて適切なレアリティバリデーションを実行
  }
}
```

### 4. 設定管理 (`SpellConfig.ts`)

```typescript
export const globalConfig = new ConfigManager();

// 環境変数からスタイルを設定
export const getCurrentPromptStyle = (): PromptStyle => {
  return globalConfig.getPromptStyle();
};
```

### 5. 統合サービス (`UnifiedSpellGenerationService.ts`)

```typescript
export class UnifiedSpellGenerationService {
  async generateSpell(selectedKanji: string[]): Promise<SpellResult | FolkloreSpellResult> {
    const currentStyle = getCurrentPromptStyle();
    const template = getPromptTemplate(currentStyle);
    // スタイルに応じた処理を実行
  }
}
```

## 使用方法

### 1. プロンプトスタイルの切り替え

```typescript
import { UnifiedSpellGenerationService } from './services/UnifiedSpellGenerationService';
import { PROMPT_STYLES } from './config/SpellConstants';

const service = new UnifiedSpellGenerationService(apiKey, model);

// 従来の魔法系スタイル
service.setPromptStyle(PROMPT_STYLES.TRADITIONAL);

// 新しい民俗学スタイル
service.setPromptStyle(PROMPT_STYLES.FOLKLORE);
```

### 2. 環境変数による設定

```bash
# .env or .dev.vars
SPELL_PROMPT_STYLE=folklore
SPELL_TEMPERATURE=0.9
```

### 3. 新しいプロンプトスタイルの追加

1. **定数の追加**:
```typescript
// SpellConstants.ts
export const NEW_ATTRIBUTES = ['新属性1', '新属性2'];
export const NEW_RARITIES = ['NewRare1', 'NewRare2'];
```

2. **プロンプトテンプレートの作成**:
```typescript
// PromptTemplates.ts
export const newPrompt: PromptTemplate = {
  style: 'new_style',
  description: '新しいスタイルの説明',
  createPrompt: (kanjiDetails: KanjiData[]) => {
    // 新しいプロンプトの実装
  }
};
```

3. **型定義の追加**:
```typescript
// shared/types/index.ts
export interface NewSpellResult {
  // 新しい結果形式の定義
}
```

## 対応するプロンプトスタイル

### 1. Traditional Style (従来)
- **属性**: 火、水、風、土、光、闇、混沌、無、食、音、聖、魔
- **レアリティ**: useless, common, rare, epic, legendary
- **出力形式**: SpellResult

### 2. Folklore Style (民俗学)
- **属性**: 五穀豊穣、厄除け、恋愛成就、雨乞い、神隠し、禁忌など
- **レアリティ**: Common, Uncommon, Rare, Epic, Legendary
- **出力形式**: FolkloreSpellResult（originフィールド追加）

## テスト戦略

### 1. 統合テスト (`UnifiedSpellGenerationService.test.ts`)

```typescript
describe('Style switching', () => {
  test('should switch between traditional and folklore styles', async () => {
    // 両方のスタイルを同一のテストで検証
  });
});
```

### 2. テストヘルパー (`TestConstants.ts`)

```typescript
export const TestHelpers = {
  getValidElements: (style: string) => {
    // スタイルに応じた有効属性リストを取得
  },
  validateResultFormat: (result: any, style: string): boolean => {
    // 結果形式の検証
  },
};
```

## 利点

1. **保守性の向上**: 新しいプロンプトスタイルを追加しても、既存のテストが自動的に対応
2. **設定の一元化**: 属性・レアリティ・プロンプトの管理が一箇所に集約
3. **型安全性**: TypeScriptの型システムによる実行時エラーの防止
4. **テストの効率化**: 単一のテストセットで複数のスタイルを検証

## 今後の拡張性

- 新しいプロンプトスタイルの追加が容易
- 属性・レアリティの動的な管理
- A/Bテストのサポート
- 複数言語対応の準備

## 実装状況

✅ 定数管理システム  
✅ プロンプトテンプレート機能  
✅ 動的バリデーション  
✅ 設定管理システム  
✅ 統合サービス  
✅ 包括的テストスイート  
✅ 型安全性の確保  

## 次のステップ

1. 既存のSpellGenerationServiceからUnifiedSpellGenerationServiceへの移行
2. 本番環境での動作テスト
3. 新しいプロンプトスタイルの追加
4. パフォーマンス最適化

---

このプロンプト抽象化レイヤーにより、MajiBattleプロジェクトはより柔軟で保守性の高い呪文生成システムを実現しています。