# Cloudflare Secrets Store 実装状況ドキュメント

## 現状の問題

1. **権限エラー**: CI/CDでのデプロイ時に「failed to fetch secrets store binding due to authorization error」が発生
2. **フォールバック動作**: ステージング環境で常に`generateFallbackSpell`が呼ばれている
3. **混在する情報**: Workers Secrets、GitHub Actions Secrets、Secret Store の概念が混在している

## Cloudflare Secrets Store の正確な情報（公式ドキュメントより）

### 概要
- **定義**: アカウントレベルのシークレットを保存するための安全で中央集約的な場所
- **特徴**: すべてのCloudflareデータセンターで暗号化されて保存される
- **状態**: オープンベータ版
- **対応**: 現在はCloudflare Workersのみ対応

### 正しい設定方法

#### wrangler.toml の構文
```toml
main = "./src/index.js"
secrets_store_secrets = [
  { 
    binding = "<BINDING_VARIABLE>", 
    store_id = "<STORE_ID>", 
    secret_name = "<MY_SECRET_NAME>" 
  }
]
```

**重要な要素**:
- `binding`: Worker内でシークレットにアクセスする際の変数名
- `store_id`: Secrets Storeの識別子
- `secret_name`: シークレットの実際の名前（スペースを含めることはできない）

#### Worker コードでのアクセス方法
```javascript
export default {
  async fetch(request, env) {
    // 非同期でシークレット値を取得
    const APIkey = await env.<BINDING_VARIABLE>.get()
    
    // 使用例
    const response = await fetch("https://api.example.com/data", {
      headers: { "Authorization": `Bearer ${APIkey}` }
    });
  }
}
```

### 重要な制限事項

1. **権限要件**: Super Administrator または Secrets Store Deployer ロールが必要
2. **ローカル開発**: プロダクションのシークレットにはローカル開発時にアクセスできない
3. **スコープ**: シークレットは明示的にWorkersにバインドする必要がある

## 現在の実装の問題点

### 1. 間違った設定構文
現在のwrangler.toml:
```toml
# 誤った構文（コメントアウト済み）
[[secrets]]
binding = "GEMINI_API_KEY"
store_id = "b8ffbf7dcbf34210b9bf420d54c0fdaa"
```

正しい構文:
```toml
secrets_store_secrets = [
  { binding = "GEMINI_API_KEY", store_id = "b8ffbf7dcbf34210b9bf420d54c0fdaa", secret_name = "GEMINI_API_KEY" }
]
```

### 2. アクセス方法の混乱
現在のコード（複数の方式が混在）:
```typescript
// Secret Store binding として扱おうとしている
if (env.GEMINI_API_KEY && typeof env.GEMINI_API_KEY === 'object' && 'get' in env.GEMINI_API_KEY) {
  geminiApiKey = await env.GEMINI_API_KEY.get();
}
// Workers Secret として扱おうとしている
else if (typeof env.GEMINI_API_KEY === 'string') {
  geminiApiKey = env.GEMINI_API_KEY;
}
```

## 推奨される解決策

### オプション1: Cloudflare Secrets Store を正しく実装
1. wrangler.toml を正しい構文に修正
2. Worker コードで `await env.GEMINI_API_KEY.get()` を使用
3. CI/CD の権限を確認（Secrets Store Deployer ロール）
4. ローカル開発用に .dev.vars を使用

### オプション2: Workers Secrets を使用（従来の方法）
1. `wrangler secret put GEMINI_API_KEY` でシークレットを設定
2. Worker コードで `env.GEMINI_API_KEY` として直接アクセス
3. 追加の権限設定は不要

## 次のステップ

1. どちらの方式を使用するか決定
2. 選択した方式に合わせてコードを統一
3. CI/CD環境での権限を確認
4. ローカル開発環境での動作を確認