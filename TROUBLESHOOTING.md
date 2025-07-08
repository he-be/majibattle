# MajiBattle - トラブルシューティング

## 現在の問題

### ステージング/本番環境でのDurable Objects API エラー

**症状:**
- ローカル環境では完全に動作
- ステージング/本番環境で `/api/game/new` が500エラー
- 基本的なAPIエンドポイント（`/api/random`）は正常動作

**エラー詳細:**
```
GET /api/game/new:1 Failed to load resource: the server responded with a status of 500 ()
{"error":"Internal server error"}

フロントエンドエラー:
Load kanji error: Error: Failed to create session
    at MajiBattleGame.ensureSession ((index):380:31)
    at async MajiBattleGame.loadKanji ((index):343:21)
    at async MajiBattleGame.init ((index):335:17)
```

**環境比較:**

| 環境 | 基本API | Durable Objects API | 状態 |
|------|---------|-------------------|------|
| ローカル (`npm run dev`) | ✅ 動作 | ✅ 動作 | 完全動作 |
| ステージング | ✅ 動作 | ❌ 500エラー | 部分的動作 |
| 本番 | ✅ 動作 | ❌ 500エラー | 部分的動作 |

## 技術スタック詳細

### アーキテクチャ
```
Frontend (Vanilla JS) 
    ↓ HTTP API calls
Workers (TypeScript)
    ↓ Durable Object binding
GameSession (Durable Object + SQLite)
```

### 設定ファイル

**wrangler.toml:**
```toml
name = "majibattle"
main = "dist/index.js"
compatibility_date = "2024-01-01"

# Staging環境
[env.staging]
name = "majibattle-staging"

[[env.staging.durable_objects.bindings]]
name = "GAME_SESSION"
class_name = "GameSession"

[[env.staging.migrations]]
tag = "v1"
new_sqlite_classes = [ "GameSession" ]
```

**ビルド出力:**
```
dist/index.js  44.63 kB │ gzip: 9.66 kB
Your Worker has access to the following bindings:
env.GAME_SESSION (GameSession)      Durable Object
```

## 実行された修正

### 1. ビルド設定修正 ✅
**問題:** Viteが0KBの空チャンクを生成
**解決策:** vite.config.tsでlib モード設定
```typescript
build: {
  lib: {
    entry: './src/index.ts',
    formats: ['es'],
    fileName: 'index',
  }
}
```

### 2. Env Interface重複修正 ✅  
**問題:** GameSession.tsとindex.tsで重複定義
**解決策:** GameSession.tsから削除、インライン型定義使用

### 3. wrangler.toml修正 ✅
**問題:** `src/index.ts` を参照、環境別設定なし
**解決策:** 
- `main = "dist/index.js"` に変更
- staging/production環境用Durable Objects設定追加

### 4. ESLint設定修正 ✅
**問題:** dist/ ディレクトリがlint対象
**解決策:** `**/dist/**` を除外設定に追加

## 診断結果

### 正常動作確認済み
- ✅ TypeScript コンパイル
- ✅ ESLint（警告のみ）
- ✅ 単体テスト（92/92テスト通過）
- ✅ E2Eテスト（20/20テスト通過）
- ✅ ビルド成果物（44KB、GameSessionエクスポート含む）
- ✅ CI/CDパイプライン
- ✅ GitHub Actions デプロイメント
- ✅ 基本Worker機能（/api/random）

### 問題が残る部分
- ❌ Durable Objects初期化（ステージング/本番環境のみ）
- ❌ GameSessionAPI（新規セッション作成）
- ❌ SQLite関連機能

## 推測される原因

### 1. Durable Objects SQL初期化エラー
**可能性:** ステージング環境でSQLiteセットアップ失敗
```typescript
await this.state.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS game_sessions (...)
`);
```

### 2. マイグレーション未適用
**可能性:** `new_sqlite_classes` マイグレーションが正しく実行されていない

### 3. 環境差異
- ローカル: Miniflare（開発用ランタイム）
- 本番: Cloudflare Workers（本番ランタイム）
- SQLiteの動作差異の可能性

## 次のステップ

### 優先度 High
1. **ステージング環境ログ確認**
   - Cloudflare Dashboard のReal-time Logsで500エラー詳細確認
   - GameSession.initializeDatabase()のエラー詳細取得

2. **強制再デプロイメント**
   - Durable Objects削除→再作成
   - マイグレーション強制実行

### 優先度 Medium  
3. **エラーハンドリング強化**
   - GameSession内でより詳細なエラーログ
   - SQLエラーの具体的内容をレスポンスに含める

4. **代替手段検証**
   - Durable Objects KV Storageでの実装
   - SQLite使用しない一時的な実装

## ファイル構成

### 主要ファイル
```
packages/workers/
├── src/
│   ├── index.ts                     # Main Worker (✅動作)
│   ├── durable-objects/
│   │   └── GameSession.ts           # Durable Object (❌問題)
│   └── data/
│       └── KanjiDataManager.ts      # Data layer (✅動作)
├── dist/
│   └── index.js                     # Built output (44KB)
├── wrangler.toml                    # Cloudflare config
└── vite.config.ts                   # Build config
```

### テスト状況
```
E2E Tests:     20/20 通過 (ローカル)
Unit Tests:    92/92 通過
Integration:   完全動作 (ローカル)
```

## 対応履歴

| 日時 | 修正内容 | 結果 |
|------|----------|------|
| 2025-07-08 14:00 | Vite設定修正、ビルドサイズ正常化 | ✅ |
| 2025-07-08 14:30 | wrangler.toml環境設定追加 | ✅ |
| 2025-07-08 15:00 | GitHubActions CI/CD追加 | ✅ |
| 2025-07-08 15:15 | 強制再デプロイメント実行 | 🔄 調査中 |

---

**最終更新:** 2025-07-08 15:18  
**担当者:** Claude Code  
**状態:** 調査継続中