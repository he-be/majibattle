# Cloudflare Durable Objects 実践ガイド

このドキュメントは、MajiBattleプロジェクトの開発で得られたCloudflare Workers とDurable Objectsの実践的なノウハウをまとめたものです。

## 目次

1. [Durable Objects SQLite移行の落とし穴](#1-durable-objects-sqlite移行の落とし穴)
2. [CI/CD環境設定の重要性](#2-cicd環境設定の重要性)
3. [セッション管理のベストプラクティス](#3-セッション管理のベストプラクティス)
4. [本番環境での問題解決方法](#4-本番環境での問題解決方法)
5. [開発・デバッグのコツ](#5-開発デバッグのコツ)

## 1. Durable Objects SQLite移行の落とし穴

### 問題: 既存クラスにSQLiteを追加できない

**現象:**
```
Cannot apply new-sqlite-class migration to class 'GameSession' that is already depended on by existing Durable Objects
```

**原因:**
一度デプロイされたDurable Objectクラスに、後からSQLiteバックエンドを追加することはできません。

**解決策:**
新しいクラス名を使用してバージョニングする：

```toml
# wrangler.toml
# Staging環境
[env.staging]
[[env.staging.durable_objects.bindings]]
name = "GAME_SESSION"
class_name = "GameSessionV2"

[[env.staging.migrations]]
tag = "v2"
new_sqlite_classes = [ "GameSessionV2" ]

# Production環境
[env.production]
[[env.production.durable_objects.bindings]]
name = "GAME_SESSION"
class_name = "GameSessionV3"

[[env.production.migrations]]
tag = "v3"
new_sqlite_classes = [ "GameSessionV3" ]
```

**重要なポイント:**
- 各環境で異なるクラス名を使用
- 既存インスタンスとの競合を完全に回避
- マイグレーションタグを適切に管理

## 2. CI/CD環境設定の重要性

### 問題: CI/CDでの環境指定ミス

**現象:**
```bash
# 失敗例
npm run deploy --workspace=@majibattle/workers -- --env production
# 結果: --env production --env production (重複)
```

**解決策:**
CI/CDでは直接wranglerコマンドを使用：

```yaml
# .github/workflows/ci.yml
- name: Deploy to production
  run: |
    cd packages/workers
    npx wrangler deploy --env production
```

**package.jsonは環境非依存に:**
```json
{
  "scripts": {
    "deploy": "wrangler deploy"
  }
}
```

## 3. セッション管理のベストプラクティス

### 問題: セッションIDの不一致

**現象:**
- フロントエンド: `af575140-d1bb-438e-819e-69c02e3e50eb`
- Durable Object: `dw126jefi4oq1yxbkphzrk`
- 結果: 404エラー

**原因:**
```typescript
// index.ts
const sessionId = crypto.randomUUID(); // フロントエンド用

// GameSession.ts 
const sessionId = generateSessionId(); // 独自生成
```

**解決策:**
統一されたセッションID管理：

```typescript
// index.ts
async function createNewGameSession(env: Env, corsHeaders: Record<string, string>) {
  const sessionId = crypto.randomUUID();
  
  const response = await durableObject.fetch(
    new Request('https://fake-host/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }), // セッションIDを渡す
    })
  );
}

// GameSession.ts
private async createSession(providedSessionId?: string): Promise<Response> {
  const sessionId = providedSessionId || generateSessionId(); // 提供されたIDを優先
}
```

### 自動復旧機能の実装

404エラー時の自動セッション再作成：

```typescript
async loadKanji() {
  try {
    await this.ensureSession();
    const response = await fetch(`/api/game/${this.sessionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // 古いセッションIDを削除して新規作成
        console.log('Session not found, creating new session...');
        localStorage.removeItem('majibattle-session-id');
        this.sessionId = null;
        await this.ensureSession();
        
        // 再試行
        const retryResponse = await fetch(`/api/game/${this.sessionId}`);
        // ...
      }
    }
  } catch (error) {
    // エラーハンドリング
  }
}
```

## 4. 本番環境での問題解決方法

### デバッグ手順

1. **APIエンドポイントの直接テスト**
```bash
# 新しいセッション作成
curl -X GET "https://your-app.workers.dev/api/game/new"

# セッション状態確認
curl -X GET "https://your-app.workers.dev/api/game/{sessionId}"
```

2. **ブラウザでのlocalStorage確認**
```javascript
// コンソールで実行
localStorage.getItem('majibattle-session-id');
localStorage.removeItem('majibattle-session-id'); // 削除
location.reload(); // リロード
```

3. **Durable Objectsのログ確認**
```typescript
console.log('GameSessionV3: Starting database initialization...');
console.log('SQL availability check:', typeof this.state.storage.sql);
```

### 本番環境特有の注意点

- **ローカル環境では再現しない問題**がある
- **既存のDurable Objectインスタンス**が原因の場合がある
- **環境変数・シークレット**の設定確認が重要

## 5. 開発・デバッグのコツ

### テスト環境の整備

```typescript
// テストでのリクエストボディ設定
const request = new Request('http://localhost/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}), // 空でもJSONとして送信
});
```

### エラーハンドリングの充実

```typescript
// Durable Object内
if (this.initError) {
  return new Response(
    JSON.stringify({
      error: 'Durable Object initialization failed',
      details: this.initError.message,
      stack: this.initError.stack,
      sqlAvailable: typeof this.state.storage.sql,
      version: 'V3', // バージョン情報も含める
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 設定ファイルの管理

```toml
# wrangler.toml - 環境ごとの明確な分離
name = "majibattle"  # ベース設定

[env.staging]
name = "majibattle-staging"
# ステージング固有の設定

[env.production] 
name = "majibattle"
# 本番固有の設定
```

## まとめ

### 重要な教訓

1. **Durable ObjectsのSQLite移行は一方向**: 既存クラスには追加できない
2. **環境の明確な分離**: staging/productionで異なるクラス名を使用
3. **セッション管理の統一**: フロントエンドとバックエンドで同じIDを使用
4. **自動復旧機能**: ユーザー体験を損なわないエラー処理
5. **CI/CDの環境設定**: 本番デプロイ時の環境指定を確実に

### 開発効率化のポイント

- **ローカル環境での限界**を理解し、ステージング環境を活用
- **段階的なデプロイ**: staging → production の順序を守る
- **ログとモニタリング**: 問題の早期発見と原因特定
- **テスト環境の整備**: 実際の使用パターンに近いテスト

このガイドは実際の開発で遭遇した問題と解決策をベースにしており、類似のプロジェクトでの参考となることを期待しています。