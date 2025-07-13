# MajiBattle ドキュメント

## 📚 ドキュメント一覧

このディレクトリには、MajiBattleプロジェクトの包括的なドキュメントが含まれています。目的に応じて適切なドキュメントを参照してください。

## 🚀 新規開発者向け

### 必読ドキュメント

1. **[開発環境セットアップ](./DEVELOPMENT_SETUP.md)** 
   - 前提条件・環境構築
   - 4層検証システム設定
   - トラブルシューティング

2. **[API設定ガイド](./API_CONFIGURATION_GUIDE.md)**
   - API構成・エンドポイント詳細
   - 環境変数設定
   - パフォーマンス指標

3. **[外部連携ガイド](./EXTERNAL_INTEGRATIONS.md)**
   - Google Gemini API連携
   - Stable Diffusion API連携
   - Cloudflare Service Auth

## 🔧 技術者向けドキュメント

### アーキテクチャ・設計

- **[プロンプト抽象化レイヤー](./PROMPT_ABSTRACTION_LAYER.md)**
  - プロンプトシステム設計
  - 動的バリデーション
  - 設定管理

### インフラ・運用

- **[Secrets管理実装ガイド](./secrets-store-implementation-guide.txt)**
  - Cloudflare Secrets Store詳細
  - 実装手順・トラブルシューティング
  - 450行の包括的ガイド

- **[Secrets管理実装状況](./secrets-store-implementation-status.md)**
  - 現在の実装状況
  - 推奨解決策

- **[Secrets Store調査報告](./secrets-store-investigation-report.md)**
  - 技術調査結果
  - 問題点・対策

## 📊 プロジェクト状況・レポート

### 完了報告

- **[Phase7最終統合レポート](../Phase7-Final-Integration-Report.md)**
  - 開発完了報告
  - 品質チェック結果
  - 121テスト成功

- **[パフォーマンス・セキュリティテスト](../performance-security-test.md)**
  - 性能評価結果
  - セキュリティ機能評価
  - 本番対応可否判定

### 問題対応

- **[ステージング環境問題](../STAGING_ISSUES.md)**
  - 本番環境問題分析
  - Secrets Store API問題
  - 緊急対応項目

- **[トラブルシューティング](../TROUBLESHOOTING.md)**
  - Durable Objects問題
  - SQL初期化エラー
  - 環境差異問題

## 🤖 AI開発ガイドライン

- **[AI開発コンテキスト](../CLAUDE.md)**
  - AIエージェント向けガイドライン
  - 開発ディレクティブ
  - 品質基準

- **[フォークロア呪文プロンプト](../prompt.txt)**
  - 十六夜教授ペルソナ定義
  - 民俗学スタイル呪文生成
  - JSON形式例

## 📁 ドキュメント分類

### 開発・技術ドキュメント
```
docs/
├── 🚀 DEVELOPMENT_SETUP.md           # 開発環境構築
├── 🔧 API_CONFIGURATION_GUIDE.md    # API詳細設定
├── 🌐 EXTERNAL_INTEGRATIONS.md      # 外部サービス連携
├── 🏗️ PROMPT_ABSTRACTION_LAYER.md   # プロンプトシステム設計
└── 📚 README.md                     # このファイル
```

### インフラ・運用ドキュメント
```
docs/
├── 🔐 secrets-store-implementation-guide.txt
├── 📊 secrets-store-implementation-status.md
└── 🔍 secrets-store-investigation-report.md
```

### プロジェクト管理ドキュメント
```
./
├── 📈 Phase7-Final-Integration-Report.md
├── ⚡ performance-security-test.md
├── 🚨 STAGING_ISSUES.md
├── 🛠️ TROUBLESHOOTING.md
├── 🤖 CLAUDE.md
└── 📜 prompt.txt
```

## 🎯 用途別ドキュメント選択

### 開発を始めたい
→ [開発環境セットアップ](./DEVELOPMENT_SETUP.md)

### API仕様を知りたい
→ [API設定ガイド](./API_CONFIGURATION_GUIDE.md)

### 外部サービス連携について
→ [外部連携ガイド](./EXTERNAL_INTEGRATIONS.md)

### エラーが発生した
→ [トラブルシューティング](../TROUBLESHOOTING.md)

### プロジェクト全体を理解したい
→ [メインREADME](../README.md)

### AI開発について
→ [AI開発コンテキスト](../CLAUDE.md)

### Secrets管理問題
→ [Secrets管理実装ガイド](./secrets-store-implementation-guide.txt)

### プロジェクト完了状況
→ [Phase7最終統合レポート](../Phase7-Final-Integration-Report.md)

## 🔄 ドキュメント更新

### 更新頻度

- **開発ガイド**: 機能追加・変更時
- **API仕様**: APIエンドポイント変更時
- **トラブルシューティング**: 新しい問題発見時
- **プロジェクト状況**: マイルストーン達成時

### 貢献方法

1. **Issue作成**: ドキュメント改善提案
2. **PR作成**: 直接的な改善・追加
3. **フィードバック**: 不明点・改善点の報告

## 📞 サポート

### 技術的質問
- GitHub Issues
- Pull Request Discussion

### 緊急時対応
- [トラブルシューティング](../TROUBLESHOOTING.md)
- [STAGING_ISSUES.md](../STAGING_ISSUES.md)

---

**📄 最終更新**: 2025年
**🤖 AI-Driven Documentation** | Made with ❤️ by [Claude Code](https://claude.ai/code)