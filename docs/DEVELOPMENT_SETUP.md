# MajiBattle 開発環境セットアップガイド

## 概要

このガイドでは、MajiBattleの開発環境を構築する詳細な手順を説明します。AI駆動開発に最適化された4層検証システムを含む完全な開発環境を構築できます。

## 前提条件

### 必須要件

- **Node.js**: 20.x以上
- **npm**: 10.x以上
- **Git**: 2.x以上
- **Cloudflare アカウント**: Workers利用可能
- **Google Gemini API**: API key取得済み

### 推奨要件

- **Visual Studio Code**: TypeScript開発最適化
- **Cloudflare Wrangler CLI**: ローカル開発用
- **Chrome/Chromium**: E2Eテスト用

## 環境構築手順

### 1. リポジトリのクローン

```bash
# リポジトリクローン
git clone https://github.com/he-be/majibattle.git
cd majibattle

# ブランチ確認
git branch -a
git status
```

### 2. 依存関係のインストール

```bash
# ルートレベルでの依存関係インストール
npm install

# Workers パッケージの依存関係
cd packages/workers
npm install

# 共通パッケージの依存関係（存在する場合）
cd ../shared
npm install 2>/dev/null || echo "Shared package not found, skipping"

# ルートに戻る
cd ../..
```

### 3. 環境変数の設定

#### ローカル開発用設定ファイル作成

```bash
# Workers用の環境変数ファイル作成
cd packages/workers
cp .dev.vars.example .dev.vars 2>/dev/null || touch .dev.vars
```

#### .dev.varsファイルの編集

```env
# packages/workers/.dev.vars

# 必須設定
GEMINI_API_KEY=your-gemini-api-key-here
IMAGE_GENERATION_ENABLED=true

# 画像生成用設定（オプション）
CF_CLIENT_ID=your-cloudflare-client-id
CF_SECRET=your-cloudflare-secret

# デバッグ用設定（オプション）
DEBUG_MODE=true
```

### 4. Cloudflare Workersの設定

#### Wrangler CLI認証

```bash
# Cloudflareアカウントにログイン
npx wrangler login

# アカウント情報確認
npx wrangler whoami

# プロジェクト設定確認
npx wrangler kv:namespace list 2>/dev/null || echo "No KV namespaces found"
```

#### wrangler.tomlの確認

```toml
# packages/workers/wrangler.toml
name = "majibattle"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[dev]
port = 8787
local_protocol = "http"

[vars]
GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17"
IMAGE_GENERATION_ENABLED = "false"  # ローカルでは無効がデフォルト

[[durable_objects.bindings]]
name = "GAME_SESSION"
class_name = "GameSession"
```

### 5. 開発サーバーの起動

```bash
cd packages/workers

# 開発サーバー起動
npm run dev

# または詳細ログ付きで起動
npx wrangler dev src/index.ts --local --port 8787
```

**アクセス確認**: http://localhost:8787

### 6. 4層検証システムのセットアップ

#### 1️⃣ TypeScript型チェック

```bash
# 型チェック実行
npm run typecheck

# 自動修正可能な場合
npx tsc --noEmit --pretty
```

#### 2️⃣ ESLint静的解析（今後実装予定）

```bash
# ESLint設定確認
ls -la .eslintrc* 2>/dev/null || echo "ESLint not configured yet"

# 将来の実行コマンド
# npm run lint
```

#### 3️⃣ Vitest単体テスト（今後実装予定）

```bash
# テスト設定確認
ls -la vitest.config.* 2>/dev/null || echo "Vitest not configured yet"
ls -la src/__tests__/ 2>/dev/null || echo "Test directory not found"

# 将来の実行コマンド
# npm run test:unit
```

#### 4️⃣ Playwright E2Eテスト（今後実装予定）

```bash
# Playwright設定確認
ls -la playwright.config.* 2>/dev/null || echo "Playwright not configured yet"

# 将来の実行コマンド
# npm run test:e2e
```

## 開発ワークフロー

### 日常的な開発サイクル

```bash
# 1. 最新の変更を取得
git pull origin main

# 2. 新しい機能ブランチを作成
git checkout -b feature/your-feature-name

# 3. 開発サーバー起動
cd packages/workers && npm run dev

# 4. コード変更後の検証
npm run typecheck  # 型チェック
npm run build      # ビルド確認

# 5. 変更をコミット
git add .
git commit -m "feat: add your feature description"

# 6. プッシュしてPR作成
git push origin feature/your-feature-name
```

### ホットリロード確認

開発サーバーが起動中に以下を確認：

1. **src/index.ts**を編集
2. 自動でリビルドが実行される
3. ブラウザで http://localhost:8787 を確認
4. 変更が反映されている

### デバッグ設定

#### Console Logging

```typescript
// 開発用ログ出力
console.log('🎯 Debug info:', { selectedKanji, sessionId });
console.error('❌ Error occurred:', error);
console.info('ℹ️ Service status:', status);
```

#### Wrangler Logs

```bash
# リアルタイムログ表示
npx wrangler tail

# 本番環境のログ
npx wrangler tail --env production

# Staging環境のログ
npx wrangler tail --env staging
```

## トラブルシューティング

### よくある問題と解決策

#### 1. 開発サーバーが起動しない

```bash
# ポート使用状況確認
netstat -an | grep 8787
lsof -i :8787

# プロセス終了
kill -9 $(lsof -ti :8787)

# 再起動
npm run dev
```

#### 2. 型エラーが発生する

```bash
# TypeScript設定確認
cat tsconfig.json

# 型定義再インストール
rm -rf node_modules package-lock.json
npm install

# 型チェック実行
npm run typecheck
```

#### 3. API Key関連エラー

```bash
# 環境変数確認
cat .dev.vars

# Secrets設定確認
npx wrangler secret list

# ローカル環境変数設定
echo "GEMINI_API_KEY=your-key" >> .dev.vars
```

#### 4. Durable Objects関連エラー

```bash
# ローカルストレージクリア
rm -rf .wrangler/

# 開発サーバー再起動
npm run dev
```

#### 5. ビルドエラー

```bash
# キャッシュクリア
npm run build -- --force

# または
rm -rf dist/ .wrangler/
npm run build
```

### ログ分析

#### エラーレベル別対応

```bash
# エラーログの確認
npx wrangler tail | grep ERROR

# 警告ログの確認  
npx wrangler tail | grep WARN

# 情報ログの確認
npx wrangler tail | grep INFO
```

## IDE設定

### Visual Studio Code

#### 推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "cloudflare.vscode-cloudflare-workers"
  ]
}
```

#### デバッグ設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Wrangler",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "localRoot": "${workspaceFolder}/packages/workers",
      "remoteRoot": "/"
    }
  ]
}
```

#### ワークスペース設定

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.toml": "toml"
  }
}
```

## テスト環境設定

### 単体テスト環境（将来実装）

```bash
# Vitest設定ファイル作成
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'miniflare',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
EOF
```

### E2Eテスト環境（将来実装）

```bash
# Playwright設定確認
npx playwright install --with-deps

# 設定ファイル作成
npx playwright init
```

## 継続的インテグレーション

### ローカルCI/CD検証

```bash
# GitHub Actionsのワークフローをローカルで検証
# (act ツールを使用)
act -j test

# または手動で各ステップを実行
npm run typecheck
npm run build
# npm run test:unit    # 将来実装
# npm run test:e2e     # 将来実装
```

### Pre-commit フックの設定

```bash
# Huskyの設定確認
ls -la .husky/ 2>/dev/null || echo "Husky not configured"

# 手動でpre-commit検証
npm run typecheck && npm run build
```

## 性能監視

### 開発時のパフォーマンス測定

```bash
# ビルド時間測定
time npm run build

# バンドルサイズ確認
ls -lah dist/

# 開発サーバーのメモリ使用量
ps aux | grep wrangler
```

### プロファイリング

```typescript
// パフォーマンス測定コード例
const start = Date.now();
// 処理実行
const duration = Date.now() - start;
console.log(`⏱️ Operation took ${duration}ms`);
```

## セキュリティ設定

### 機密情報の管理

```bash
# .gitignoreの確認
cat .gitignore | grep -E "\.(env|vars)"

# 機密ファイルが追跡されていないことを確認
git status --ignored
```

### API Key のローテーション

```bash
# 開発用キーの定期更新
echo "新しいキーに更新してください: $(date)"

# 本番用キーの更新
# npx wrangler secret put GEMINI_API_KEY --env production
```

## 次のステップ

### 開発環境が正常に動作したら

1. **機能開発**: [API設定ガイド](./API_CONFIGURATION_GUIDE.md)を参照
2. **外部連携**: [外部連携ガイド](./EXTERNAL_INTEGRATIONS.md)を参照  
3. **本番デプロイ**: [デプロイガイド](../README.md#デプロイメント)を参照
4. **トラブルシューティング**: [トラブルシューティング](../TROUBLESHOOTING.md)を参照

### 開発チームへの参加

1. **GitHub Issue**: 新機能やバグ報告
2. **Pull Request**: コード貢献
3. **ドキュメント改善**: 本ガイドの更新
4. **テスト追加**: 品質向上への貢献

## 関連リンク

- **[API Configuration Guide](./API_CONFIGURATION_GUIDE.md)** - API詳細設定
- **[External Integrations](./EXTERNAL_INTEGRATIONS.md)** - 外部サービス連携
- **[Troubleshooting](../TROUBLESHOOTING.md)** - 問題解決ガイド
- **[CLAUDE.md](../CLAUDE.md)** - AI開発ガイドライン