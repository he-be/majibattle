/**
 * 呪文＋画像生成統合サービス
 * 呪文生成と画像生成を組み合わせた総合的な生成システム
 */

import { SpellResult, FolkloreSpellResult } from '@majibattle/shared';
import { UnifiedSpellGenerationService } from './UnifiedSpellGenerationService';
import { ImagePromptGenerationService } from './ImagePromptGenerationService';
import { StableDiffusionService, GeneratedImage } from './StableDiffusionService';
import { SpellResultAdapter } from '../adapters/SpellResultAdapter';

export interface SpellWithImage extends SpellResult {
  generatedImage?: GeneratedImage;
  imageGenerationEnabled: boolean;
  imageGenerationError?: string;
}

export interface ImageGenerationConfig {
  enabled: boolean;
  apiEndpoint: string;
  cfClientId?: string;
  cfSecret?: string;
  fallbackOnError: boolean;
}

export class SpellWithImageGenerationService {
  private spellService: UnifiedSpellGenerationService;
  private promptService: ImagePromptGenerationService;
  private imageService?: StableDiffusionService;
  private config: ImageGenerationConfig;

  constructor(geminiApiKey: string, geminiModel: string, imageConfig: ImageGenerationConfig) {
    this.spellService = new UnifiedSpellGenerationService(geminiApiKey, geminiModel);
    this.promptService = new ImagePromptGenerationService();
    this.config = imageConfig;

    // 画像生成が有効な場合のみサービスを初期化
    if (this.config.enabled && this.config.apiEndpoint) {
      this.imageService = new StableDiffusionService(
        this.config.apiEndpoint,
        this.config.cfClientId,
        this.config.cfSecret
      );
    }
  }

  /**
   * 呪文と画像を同時生成
   */
  async generateSpellWithImage(selectedKanji: string[]): Promise<SpellWithImage> {
    console.log('🎯 Starting spell + image generation for kanji:', selectedKanji);

    try {
      // 1. 呪文を生成
      console.log('📝 Generating spell...');
      const rawSpellResult = await this.spellService.generateSpell(selectedKanji);
      const spellResult = SpellResultAdapter.toUnifiedFormat(rawSpellResult);

      // 基本レスポンスを準備
      const response: SpellWithImage = {
        ...spellResult,
        imageGenerationEnabled: this.config.enabled,
      };

      // 2. 画像生成（有効な場合のみ）
      if (this.config.enabled && this.imageService) {
        try {
          // まず接続を確認
          console.log('🔍 Checking image service availability...');
          const isAvailable = await this.checkImageServiceAvailability();

          if (isAvailable) {
            console.log('🎨 Generating image...');
            const generatedImage = await this.generateImageForSpell(rawSpellResult);
            response.generatedImage = generatedImage;
            console.log('✅ Spell + image generation completed successfully');
          } else {
            // サービスが利用できない場合は代替画像を使用
            console.log('⚠️ Image service unavailable, using placeholder');
            response.generatedImage = {
              imageUrl: '/images/underconstruction.svg',
              prompt: 'Service unavailable',
              seed: 0,
              generationTime: 0,
            };
            response.imageGenerationError = 'Image generation service is currently unavailable';
          }
        } catch (imageError) {
          console.error('❌ Image generation failed:', imageError);

          if (this.config.fallbackOnError) {
            // 画像生成失敗時は代替画像を使用
            response.generatedImage = {
              imageUrl: '/images/underconstruction.svg',
              prompt: 'Generation failed',
              seed: 0,
              generationTime: 0,
            };
            response.imageGenerationError =
              imageError instanceof Error ? imageError.message : 'Image generation failed';
            console.log('⚠️ Using placeholder image due to generation failure');
          } else {
            // フォールバック無効の場合はエラーを投げる
            throw imageError;
          }
        }
      } else {
        console.log('ℹ️ Image generation is disabled');
      }

      return response;
    } catch (error) {
      console.error('❌ Spell + image generation failed:', error);
      throw error;
    }
  }

  /**
   * 画像サービスの利用可能性をチェック
   */
  private async checkImageServiceAvailability(): Promise<boolean> {
    if (!this.imageService) {
      return false;
    }

    try {
      // タイムアウト付きで接続テスト
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 3000); // 3秒のタイムアウト
      });

      const testPromise = this.imageService.testConnection();

      const result = await Promise.race([testPromise, timeoutPromise]);
      return result;
    } catch (error) {
      console.error('❌ Service availability check failed:', error);
      return false;
    }
  }

  /**
   * 呪文から画像を生成
   */
  private async generateImageForSpell(
    spell: SpellResult | FolkloreSpellResult
  ): Promise<GeneratedImage> {
    if (!this.imageService) {
      throw new Error('Image generation service is not available');
    }

    console.log('🔮 Generating image prompt for spell...');
    const imagePrompt = this.promptService.generatePrompt(spell);

    console.log('🎨 Generated prompt:', imagePrompt.prompt);
    console.log('🚫 Negative prompt:', imagePrompt.negativePrompt);

    return await this.imageService.generateImage(imagePrompt);
  }

  /**
   * 呪文のスタイルを変更
   */
  setPromptStyle(style: 'traditional' | 'folklore'): void {
    // スタイル変更をUnifiedSpellGenerationServiceに委譲
    const promptStyle = style === 'traditional' ? 'TRADITIONAL' : 'FOLKLORE';
    this.spellService.setPromptStyle(promptStyle as any);
  }

  /**
   * 画像生成設定を更新
   */
  updateImageConfig(config: Partial<ImageGenerationConfig>): void {
    this.config = { ...this.config, ...config };

    // 画像サービスを再初期化
    if (this.config.enabled && this.config.apiEndpoint) {
      this.imageService = new StableDiffusionService(
        this.config.apiEndpoint,
        this.config.cfClientId,
        this.config.cfSecret
      );
    } else {
      this.imageService = undefined;
    }
  }

  /**
   * 画像生成サービスの接続テスト
   */
  async testImageService(): Promise<boolean> {
    if (!this.imageService) {
      return false;
    }

    return await this.imageService.testConnection();
  }

  /**
   * 利用可能なサンプラー一覧を取得
   */
  async getAvailableSamplers(): Promise<string[]> {
    if (!this.imageService) {
      return [];
    }

    return await this.imageService.getSamplers();
  }
}
