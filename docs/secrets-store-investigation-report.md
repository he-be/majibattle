# Cloudflare Secrets Store 調査報告書

## 概要

MajiBattleプロジェクトにおいて、Cloudflare Secrets Storeの導入を試行したが、複数の技術的問題により実装が困難であることが判明した。本報告書では、試行錯誤の過程と発見した問題点をまとめ、従来のWorkers Secretsへの回帰を推奨する。

## 調査期間

2025年7月12日 - 継続中

## 試行した実装

### 1. wrangler.toml設定

**公式ドキュメントに準拠した設定：**
```toml
[env.staging]
secrets_store_secrets = [
  { binding = "GEMINI_SECRET", store_id = "b8ffbf7dcbf34210b9bf420d54c0fdaa", secret_name = "GEMINI_API_KEY" }
]
```

### 2. TypeScript型定義

```typescript
interface Env {
  GEMINI_SECRET: { get(): Promise<string> };
  GEMINI_API_KEY?: string; // ローカル開発用
  GEMINI_MODEL: string;
}
```

### 3. コード実装

```typescript
if (typeof env.GEMINI_SECRET === 'object' && env.GEMINI_SECRET !== null && 'get' in env.GEMINI_SECRET) {
  geminiApiKey = await env.GEMINI_SECRET.get();
} else if (typeof env.GEMINI_API_KEY === 'string') {
  geminiApiKey = env.GEMINI_API_KEY;
}
```

## 発見した問題

### 1. 根本的な問題：Service Bindingとしての誤認識

**実際のログ出力：**
```
GEMINI_SECRET constructor: Fetcher
GEMINI_SECRET type: object
```

- `env.GEMINI_SECRET`がSecrets Storeバインディングではなく、`Fetcher`型（Service Binding）として認識されている
- 公式ドキュメントの`get()`メソッド（引数なし）が使用できない

### 2. 複数のAPIアクセス方法の失敗

**試行結果：**
```
方法1失敗: Failed to execute 'get' on 'Fetcher': parameter 1 is not of type 'string'.
方法2失敗: Fetch API cannot load: GEMINI_API_KEY
方法3失敗: Fetch API cannot load: /
```

1. **`await env.GEMINI_SECRET.get()`**: Fetcherは引数を要求
2. **`await env.GEMINI_SECRET.get('GEMINI_API_KEY')`**: Fetch APIエラー
3. **`await env.GEMINI_SECRET.fetch('/')`**: Fetch APIエラー

### 3. プラットフォーム側の設定問題

- Cloudflareダッシュボードでバインディングが正しく表示されている
- wrangler.toml設定は公式ドキュメントに準拠
- しかし、ランタイムでの認識が異なる

### 4. Alpha機能の不安定性

```bash
wrangler secrets-store
🔐 Manage the Secrets Store [alpha]
```

- Secrets Store機能は**alpha版**
- 本番環境での使用には安定性の懸念

## 検証データ

### 環境バインディング状況

```json
{
  "All bindings": [
    {
      "key": "GAME_SESSION",
      "type": "object", 
      "constructor": "DurableObjectNamespace",
      "isObject": true,
      "hasGet": true
    },
    {
      "key": "GEMINI_MODEL",
      "type": "string",
      "constructor": "String", 
      "isObject": false,
      "hasGet": false
    },
    {
      "key": "GEMINI_SECRET",
      "type": "object",
      "constructor": "Fetcher",  // ← 問題の核心
      "isObject": true,
      "hasGet": true
    }
  ]
}
```

### API権限設定

- GitHub Actions APIトークン権限：
  - `Workers スクリプト:編集`
  - `Secrets Store:編集` ✓

## 試行した解決策

### 1. バインディング名の変更
- `GEMINI_API_KEY` → `GEMINI_SECRET`
- 結果：同じ問題が継続

### 2. wrangler.toml構文の変更
- 配列形式、オブジェクト形式など複数試行
- 結果：構文エラーまたは同じ問題

### 3. Cloudflareダッシュボードでの手動確認
- 変数タブでの競合排除
- バインディングタブでの正しい設定確認
- 結果：設定は正しいが、ランタイムで誤認識

## 結論

### 問題の根本原因

1. **Secrets Store機能の不安定性**: Alpha版機能のため、実装が不完全
2. **プラットフォーム側の認識エラー**: 正しい設定でもService Bindingとして解釈される
3. **公式ドキュメントとの乖離**: 実際の動作が仕様と異なる

### 推奨事項

**従来のWorkers Secretsへの回帰を強く推奨**

理由：
- 安定性が確保されている
- 実装が単純で確実
- 本プロジェクトの要件（単一API key）には十分

## 実装回帰計画

### 1. Secrets Store関連の削除

- `secrets_store_secrets`設定の削除
- 関連する型定義の削除
- 複雑なアクセスロジックの削除

### 2. Workers Secrets設定

```bash
# GitHub Actions経由で設定
wrangler secret put GEMINI_API_KEY --env staging
wrangler secret put GEMINI_API_KEY --env production
```

### 3. 簡素化されたコード

```typescript
interface Env {
  GAME_SESSION: DurableObjectNamespace;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
}

// 使用時
const spellService = new UnifiedSpellGenerationService(env.GEMINI_API_KEY, env.GEMINI_MODEL);
```

## 今後の検討事項

- Secrets Storeがbeta/stable版に移行した際の再評価
- 複数のAPIキーが必要になった場合のみ再検討
- 当面は既存のWorkers Secretsで運用継続

## 学習事項

1. **Alpha機能の採用リスク**: 新機能は安定化を待つべき
2. **設定の複雑性**: シンプルなソリューションの価値
3. **公式ドキュメントの限界**: 実装と仕様の乖離の可能性

---

**最終更新**: 2025年7月12日  
**ステータス**: Secrets Store断念、Workers Secrets回帰決定