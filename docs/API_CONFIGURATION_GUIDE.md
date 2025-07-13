# MajiBattle API Configuration Guide

## 概要

MajiBattleは、AIを活用した漢字呪文生成ゲームのCloudflare Workers APIです。本ガイドでは、API構成、エンドポイント、認証、および設定について詳しく説明します。

## API アーキテクチャ

### 技術スタック
- **プラットフォーム**: Cloudflare Workers
- **ランタイム**: Workers Runtime (V8 JavaScript Engine)
- **ストレージ**: Durable Objects with SQLite
- **型システム**: TypeScript (strict mode)
- **ビルドツール**: Vite
- **テスト**: Vitest (単体) + Playwright (E2E)

### アプリケーション構成

```
src/
├── index.ts                 # メインWorkers実装
├── adapters/               # データ変換層
│   └── SpellResultAdapter.ts
├── services/               # ビジネスロジック層
│   ├── UnifiedSpellGenerationService.ts
│   ├── ImagePromptGenerationService.ts
│   ├── StableDiffusionService.ts
│   └── SpellWithImageGenerationService.ts
└── durable-objects/        # 永続化層
    ├── GameSession.ts      # レガシー実装
    ├── GameSessionV2.ts    # SQL対応版
    └── GameSessionV3.ts    # 本番用最新版
```

## API エンドポイント

### 1. ゲームセッション管理

#### ゲーム初期化
```http
POST /api/game/{sessionId}/init
```

**リクエスト例:**
```bash
curl -X POST https://majibattle.example.com/api/game/session123/init \
  -H "Content-Type: application/json"
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session123",
    "currentKanji": ["火", "水", "風", "土", ...],
    "selectedKanji": [],
    "maxSelection": 4
  }
}
```

#### 漢字選択
```http
POST /api/game/{sessionId}/select
```

**リクエストボディ:**
```json
{
  "kanji": "火"
}
```

#### 選択リセット
```http
POST /api/game/{sessionId}/reset
```

### 2. 呪文生成

#### AI呪文生成
```http
POST /api/game/{sessionId}/spell
```

**前提条件:** 4つの漢字が選択済み

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "spell": "炎龍召喚術",
    "kana": "えんりゅうしょうかんじゅつ", 
    "description": "古代より伝わる炎の龍を召喚する術...",
    "origin": "平安時代の陰陽師により...",
    "rarity": "legendary",
    "element": "火",
    "power": 9,
    "effects": ["大ダメージを与える", "炎属性追加効果"],
    "imageGenerationEnabled": true,
    "generatedImage": {
      "imageUrl": "/api/images/spell123.jpg",
      "prompt": "masterpiece, best quality, dragon flame magic...",
      "seed": 42,
      "generationTime": 3500
    }
  }
}
```

### 3. 静的リソース

#### ゲームUI
```http
GET /
```
HTMLゲームインターフェースを返します。

#### 代替画像
```http
GET /images/underconstruction.svg
```
画像生成失敗時のフォールバック画像。

## 環境設定

### 環境変数 (wrangler.toml)

```toml
[vars]
GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17"
IMAGE_GENERATION_ENABLED = "true"  # 画像生成の有効/無効
STABLE_DIFFUSION_API_ENDPOINT = "https://sdxl.do-not-connect.com"
```

### Workers Secrets

機密情報はCloudflare Workers Secretsとして設定：

```bash
# 必須Secrets
echo "your-gemini-api-key" | wrangler secret put GEMINI_API_KEY
echo "your-cf-client-id" | wrangler secret put CF_CLIENT_ID  
echo "your-cf-secret" | wrangler secret put CF_SECRET
```

### 開発環境設定 (.dev.vars)

```env
# ローカル開発用
GEMINI_API_KEY=your-development-key
IMAGE_GENERATION_ENABLED=true
CF_CLIENT_ID=your-dev-client-id
CF_SECRET=your-dev-secret
```

## デプロイメント構成

### 環境別設定

| 環境 | Worker名 | Durable Object | 用途 |
|------|----------|----------------|------|
| Development | majibattle | GameSession | ローカル開発 |
| Staging | majibattle-staging | GameSessionV2 | PR検証 |
| Production | majibattle | GameSessionV3 | 本番サービス |

### CI/CDパイプライン

GitHub Actionsによる自動デプロイ：

1. **品質チェック**
   - TypeScript型チェック
   - ESLint静的解析  
   - Vitest単体テスト
   - Playwright E2Eテスト

2. **デプロイメント**
   - Staging: PR作成時に自動デプロイ
   - Production: mainブランチマージ時に自動デプロイ

## パフォーマンス指標

### 現在の性能

- **ビルド時間**: 142ms
- **バンドルサイズ**: 117.50 kB (gzip: 26.98 kB)
- **API応答時間**: 平均 < 2秒
- **画像生成時間**: 平均 3.5秒

### リソース制限

- **CPU時間**: 最大 100ms/リクエスト (Workers制限)
- **メモリ**: 128MB (Workers制限)
- **リクエストサイズ**: 最大 100MB
- **レスポンスサイズ**: 最大 100MB

## エラーハンドリング

### 標準エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": "詳細な技術情報（開発時のみ）"
}
```

### 主要エラーコード

| ステータス | 原因 | 対処法 |
|-----------|------|--------|
| 400 | 不正なリクエスト | リクエスト形式を確認 |
| 404 | セッション未発見 | セッション初期化を実行 |
| 429 | レート制限 | しばらく待ってリトライ |
| 500 | サーバーエラー | ログを確認、サポートに連絡 |

## セキュリティ

### CORS設定

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

### 認証

- **外部API**: Secretsによるトークン管理
- **Cloudflare Service Auth**: CF_CLIENT_ID/CF_SECRETによる認証
- **セッション管理**: Durable Objectsによる状態管理

## モニタリング

### ログ出力

```javascript
console.log('🎯 Starting spell generation...');
console.error('❌ Image generation failed:', error);
console.log('✅ Spell generation completed');
```

### メトリクス

- リクエスト数
- エラー率  
- レスポンス時間
- Durable Objects使用量

## トラブルシューティング

よくある問題と解決策については、[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)を参照してください。

## 関連ドキュメント

- [外部連携ガイド](./EXTERNAL_INTEGRATIONS.md)
- [開発環境セットアップ](./DEVELOPMENT_SETUP.md)
- [Secrets管理ガイド](./secrets-store-implementation-guide.txt)