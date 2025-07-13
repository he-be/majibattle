# MajiBattle 外部連携ガイド

## 概要

MajiBattleは複数の外部サービスと連携してAI駆動の呪文生成とイメージ生成を実現しています。本ガイドでは、各外部サービスとの連携詳細、設定方法、トラブルシューティングについて説明します。

## 外部サービス一覧

### 1. Google Gemini API
- **用途**: AI呪文生成
- **バージョン**: Gemini 2.5 Flash Lite Preview
- **認証**: API Key

### 2. Stable Diffusion WebUI API  
- **用途**: AI画像生成
- **エンドポイント**: https://sdxl.do-not-connect.com
- **認証**: Cloudflare Service Auth

### 3. Cloudflare Services
- **Workers**: アプリケーション実行基盤
- **Durable Objects**: セッション状態管理
- **Service Auth**: API認証

## Google Gemini API 連携

### 基本設定

```typescript
interface GeminiConfig {
  apiKey: string;           // Workers Secret
  model: string;            // Environment Variable
  endpoint: string;         // 固定
}

const config = {
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_MODEL,  // "gemini-2.5-flash-lite-preview-06-17"
  endpoint: "https://generativelanguage.googleapis.com"
};
```

### API呼び出し実装

```typescript
async function generateSpell(selectedKanji: string[]) {
  const response = await fetch(
    `${endpoint}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048
        }
      })
    }
  );
}
```

### プロンプト戦略

#### 従来スタイル
```
あなたは魔法学校の教授です。
選択された漢字: ${selectedKanji.join(', ')}
これらを組み合わせて創造的な呪文を作成してください。
```

#### 民俗学スタイル  
```
あなたは十六夜教授、日本の民俗学者です。
漢字: ${selectedKanji.join(', ')}
これらから日本の伝統的な民俗呪術を創作してください。
```

### エラーハンドリング

```typescript
try {
  const result = await geminiAPI.generate(prompt);
  return parseSpellResult(result);
} catch (error) {
  if (error.status === 429) {
    throw new Error('Gemini API rate limit exceeded');
  }
  if (error.status === 400) {
    throw new Error('Invalid prompt format');
  }
  throw new Error(`Gemini API error: ${error.message}`);
}
```

### レート制限

- **Gemini 2.5 Flash Lite**: 15 RPM (無料枠)
- **対策**: 適切なエラーハンドリングとリトライ機構

## Stable Diffusion WebUI API 連携

### 基本設定

```typescript
interface StableDiffusionConfig {
  apiEndpoint: string;      // Environment Variable
  cfClientId: string;       // Workers Secret
  cfSecret: string;         // Workers Secret
  checkpoint: string;       // 固定設定
}

const config = {
  apiEndpoint: env.STABLE_DIFFUSION_API_ENDPOINT,
  cfClientId: env.CF_CLIENT_ID,
  cfSecret: env.CF_SECRET,
  checkpoint: 'sd\\waiNSFWIllustrious_v140.safetensors'
};
```

### 認証実装

```typescript
class StableDiffusionService {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Cloudflare Service Auth
    if (this.cfClientId && this.cfSecret) {
      headers['CF-Access-Client-Id'] = this.cfClientId;
      headers['CF-Access-Client-Secret'] = this.cfSecret;
    }
    
    return headers;
  }
}
```

### 画像生成パラメータ

#### SDXL固定設定
```typescript
const imagePrompt: ImagePrompt = {
  prompt: "masterpiece,best quality,amazing quality,fantasy art,game illustration,...",
  negativePrompt: "nsfw,bad quality,worst quality,worst detail,sketch,censor,text,logo,watermark",
  width: 1024,              // 固定
  height: 1024,             // 固定  
  steps: 20,                // 固定
  cfgScale: 7,              // 固定
  seed: -1,                 // 固定（ランダム）
  samplerName: 'Euler a',   // 固定
  checkpoint: 'sd\\waiNSFWIllustrious_v140.safetensors'  // 固定
};
```

### 可用性チェック

```typescript
async function checkImageServiceAvailability(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>(resolve => 
      setTimeout(() => resolve(false), 3000)  // 3秒タイムアウト
    );
    
    const testPromise = this.imageService.testConnection();
    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Service availability check failed:', error);
    return false;
  }
}
```

### フォールバック機構

```typescript
// サービス利用不可時の代替画像
if (!isAvailable) {
  response.generatedImage = {
    imageUrl: '/images/underconstruction.svg',
    prompt: 'Service unavailable',
    seed: 0,
    generationTime: 0
  };
  response.imageGenerationError = 'Image generation service is currently unavailable';
}
```

## Cloudflare Service Auth 設定

### 認証フロー

1. **Access Application作成**
   ```bash
   # Cloudflare Dashboard
   Zero Trust > Access > Applications > Add Application
   ```

2. **Service Token生成**
   ```bash
   # Service Auth設定
   Client ID: クライアント識別子
   Client Secret: 認証用シークレット
   ```

3. **Workers Secrets設定**
   ```bash
   echo "your-client-id" | wrangler secret put CF_CLIENT_ID
   echo "your-client-secret" | wrangler secret put CF_SECRET
   ```

### ポリシー設定

```yaml
# Access Policy例
Name: "Stable Diffusion API Access"
Action: Allow
Rules:
  - Service Token: [生成されたToken]
```

## 統合サービスアーキテクチャ

### SpellWithImageGenerationService

```typescript
class SpellWithImageGenerationService {
  constructor(
    geminiApiKey: string,
    geminiModel: string, 
    imageConfig: ImageGenerationConfig
  ) {
    this.spellService = new UnifiedSpellGenerationService(geminiApiKey, geminiModel);
    this.promptService = new ImagePromptGenerationService();
    this.imageService = new StableDiffusionService(
      imageConfig.apiEndpoint,
      imageConfig.cfClientId,
      imageConfig.cfSecret
    );
  }
  
  async generateSpellWithImage(selectedKanji: string[]): Promise<SpellWithImage> {
    // 1. 呪文生成 (Gemini)
    const spellResult = await this.spellService.generateSpell(selectedKanji);
    
    // 2. 画像生成 (Stable Diffusion)
    if (this.config.enabled && await this.checkImageServiceAvailability()) {
      const generatedImage = await this.generateImageForSpell(spellResult);
      return { ...spellResult, generatedImage };
    }
    
    // 3. フォールバック
    return { ...spellResult, imageGenerationError: 'Service unavailable' };
  }
}
```

## プロンプト生成システム

### ImagePromptGenerationService

```typescript
class ImagePromptGenerationService {
  generatePrompt(spell: SpellResult): ImagePrompt {
    // 属性別スタイル
    const elementStyle = this.getElementStyle(spell.element);
    
    // 効果からビジュアル要素抽出
    const visualElements = this.extractVisualElements(spell.effects);
    
    // 呪文名からシンボル推測
    const symbolism = this.extractSymbolism(spell.name, spell.description);
    
    // プロンプト構築
    const dynamicContent = [symbolism, elementStyle, visualElements]
      .filter(Boolean)
      .join(', ');
      
    return {
      prompt: `masterpiece,best quality,amazing quality,fantasy art,game illustration,${dynamicContent}`,
      negativePrompt: 'nsfw,bad quality,worst quality,worst detail,sketch,censor,text,logo,watermark',
      // ... SDXL固定設定
    };
  }
}
```

## 環境別設定

### Development
```env
# .dev.vars
GEMINI_API_KEY=dev-key
CF_CLIENT_ID=dev-client-id
CF_SECRET=dev-secret
IMAGE_GENERATION_ENABLED=true
```

### Staging  
```toml
# wrangler.toml
[env.staging]
vars = { 
  GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17",
  IMAGE_GENERATION_ENABLED = "true",
  STABLE_DIFFUSION_API_ENDPOINT = "https://sdxl.do-not-connect.com"
}
```

### Production
```toml
# wrangler.toml  
[env.production]
vars = {
  GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17", 
  IMAGE_GENERATION_ENABLED = "true",
  STABLE_DIFFUSION_API_ENDPOINT = "https://sdxl.do-not-connect.com"
}
```

## トラブルシューティング

### よくある問題

#### 1. Gemini API エラー
```bash
# エラー: 401 Unauthorized
→ GEMINI_API_KEYの設定を確認

# エラー: 429 Too Many Requests  
→ レート制限、しばらく待機

# エラー: 400 Bad Request
→ プロンプト形式を確認
```

#### 2. Stable Diffusion API エラー
```bash
# エラー: 403 Forbidden
→ CF_CLIENT_ID/CF_SECRETの設定確認

# エラー: Connection timeout
→ サービス可用性チェック、フォールバック動作確認

# エラー: 502 Bad Gateway
→ Stable Diffusion WebUI サーバー状態確認
```

#### 3. 設定関連エラー
```bash
# Workers Secretsが消失
→ GitHub ActionsでのSecrets自動設定を確認

# 環境変数未設定
→ wrangler.tomlのvarsセクション確認
```

### デバッグ方法

```typescript
// サービス状態確認
console.log('🔍 Checking image service availability...');
const isAvailable = await this.checkImageServiceAvailability();
console.log(`Service status: ${isAvailable ? 'Available' : 'Unavailable'}`);

// リクエスト詳細ログ
console.log('🎨 Generated prompt:', imagePrompt.prompt);
console.log('🚫 Negative prompt:', imagePrompt.negativePrompt);
```

## 性能最適化

### レスポンス時間改善
- **並列処理**: 呪文生成と画像生成の並列化検討
- **キャッシュ**: 類似プロンプトの結果キャッシュ
- **タイムアウト**: 適切なタイムアウト設定（3秒）

### コスト最適化
- **条件付き生成**: 画像生成の有効/無効制御
- **フォールバック**: サービス利用不可時の代替画像提供
- **エラーハンドリング**: 適切なリトライ回数制限

## セキュリティ考慮事項

### API Key管理
- Workers Secretsによる安全な保管
- 環境別の適切なKey使い分け
- 定期的なKey更新

### アクセス制御  
- Cloudflare Service Authによる認証
- CORS適切な設定
- レート制限による悪用防止

## 関連ドキュメント

- [API設定ガイド](./API_CONFIGURATION_GUIDE.md)
- [開発セットアップ](./DEVELOPMENT_SETUP.md)
- [トラブルシューティング](../TROUBLESHOOTING.md)