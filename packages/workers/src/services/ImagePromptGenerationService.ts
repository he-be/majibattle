/**
 * AI画像生成用プロンプト生成サービス
 * 呪文の内容からStable Diffusion用の英語プロンプトを自動生成
 */

import { SpellResult, FolkloreSpellResult } from '@majibattle/shared';

export interface ImagePrompt {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number;
  samplerName: string;
  checkpoint?: string;
}

export class ImagePromptGenerationService {
  /**
   * 呪文結果から画像生成プロンプトを作成（SDXL固定設定対応）
   */
  generatePrompt(spell: SpellResult | FolkloreSpellResult): ImagePrompt {
    // 呪文の基本情報を抽出
    const spellName = this.getSpellName(spell);
    const description = this.getDescription(spell);
    const effects = spell.effects;
    const element = this.getElement(spell);

    // 属性に基づく色調と環境
    const elementStyle = this.getElementStyle(element);

    // 効果からビジュアル要素を抽出
    const visualElements = this.extractVisualElements(effects);

    // 呪文名からシンボルやモチーフを推測
    const symbolism = this.extractSymbolism(spellName, description);

    // 説明文から追加要素を抽出
    const descriptionElements = this.extractElementsFromDescription(description);

    // プロンプトを構築（固定品質タグ + 動的コンテンツ）
    const dynamicContent = [symbolism, elementStyle, visualElements, descriptionElements]
      .filter(Boolean)
      .join(', ');

    // 固定設定に従ったプロンプト構築
    const prompt = `masterpiece,best quality,amazing quality,fantasy art, game illustration, ${dynamicContent}`;

    // 固定ネガティブプロンプト
    const negativePrompt =
      'nsfw, bad quality,worst quality,worst detail,sketch,censor, text, logo, watermark';

    return {
      prompt,
      negativePrompt,
      width: 1024, // 固定値
      height: 1024, // 固定値
      steps: 20, // 固定値
      cfgScale: 7, // 固定値
      seed: -1, // 固定値
      samplerName: 'Euler a', // 固定値
      checkpoint: 'sd\\waiNSFWIllustrious_v140.safetensors', // 固定値
    };
  }

  /**
   * 呪文名を取得（統一処理）
   */
  private getSpellName(spell: SpellResult | FolkloreSpellResult): string {
    return 'name' in spell ? spell.name : spell.spell;
  }

  /**
   * 説明文を取得（統一処理）
   */
  private getDescription(spell: SpellResult | FolkloreSpellResult): string {
    if ('story' in spell) {
      return spell.story;
    }
    return spell.description;
  }

  /**
   * 属性を取得（統一処理）
   */
  private getElement(spell: SpellResult | FolkloreSpellResult): string {
    return 'attribute' in spell ? spell.attribute : spell.element;
  }

  /**
   * 説明文から追加要素を抽出
   */
  private extractElementsFromDescription(description: string): string {
    const elements = [];

    // 説明文から重要なキーワードを抽出
    if (description.includes('神') || description.includes('聖')) {
      elements.push('divine elements');
    }
    if (description.includes('闇') || description.includes('暗')) {
      elements.push('dark mystical atmosphere');
    }
    if (description.includes('光') || description.includes('輝')) {
      elements.push('radiant glow');
    }
    if (description.includes('戦') || description.includes('闘')) {
      elements.push('battle scene');
    }
    if (description.includes('自然') || description.includes('森')) {
      elements.push('natural environment');
    }
    if (description.includes('古') || description.includes('昔')) {
      elements.push('ancient mystical');
    }
    if (description.includes('村') || description.includes('里')) {
      elements.push('village setting');
    }
    if (description.includes('祭') || description.includes('儀式')) {
      elements.push('ritual ceremony');
    }

    return elements.length > 0 ? elements.join(', ') : 'magical atmosphere';
  }

  /**
   * 属性に基づく色調と環境スタイル
   */
  private getElementStyle(element: string): string {
    const elementStyles: Record<string, string> = {
      // 従来属性
      火: 'fire element, red orange flames, warm colors, burning energy',
      水: 'water element, blue aquatic theme, flowing waves, liquid magic',
      風: 'wind element, swirling air, green nature tones, floating leaves',
      土: 'earth element, brown stone textures, solid ground, rocky terrain',
      光: 'light element, bright golden glow, radiant beams, holy illumination',
      闇: 'dark element, purple shadows, mysterious void, shadow magic',
      混沌: 'chaos element, multicolored energy, swirling vortex, chaotic patterns',
      無: 'void element, minimalist design, empty space, neutral tones',
      食: 'food element, warm kitchen tones, feast imagery, culinary magic',
      音: 'sound element, vibrating waves, musical notes, sonic energy',
      聖: 'holy element, white gold divine light, sacred symbols, blessed aura',
      魔: 'arcane element, purple dark magic, mystical circles, forbidden power',

      // 民俗学属性
      五穀豊穣: 'harvest abundance, golden grain fields, agricultural prosperity',
      厄除け: 'protective ward, purifying light, cleansing energy',
      恋愛成就: 'romantic pink energy, heart symbols, love magic',
      雨乞い: 'storm clouds, rain ritual, weather magic',
      神隠し: 'mysterious forest, spiritual realm, otherworldly mist',
      禁忌: 'forbidden dark magic, ominous atmosphere, taboo symbols',
      '豊穣・家畜': 'pastoral scene, animal blessing, farm abundance',
      '祈願・精霊': 'spirit ritual, ethereal beings, prayer ceremony',
      健康長寿: 'healing light, vitality energy, life force',
      商売繁盛: 'prosperity symbols, golden coins, merchant success',
      学業成就: 'scholarly wisdom, ancient books, knowledge light',
      無病息災: 'healing herbs, protective barrier, health blessing',
      魔除け: 'exorcism ritual, purifying flames, demon ward',
      縁結び: 'connection threads, binding magic, relationship energy',
      安産祈願: 'maternal blessing, protective embrace, gentle care',
      交通安全: 'journey protection, safe passage, travel blessing',
    };

    return elementStyles[element] || 'magical energy, mystical atmosphere';
  }

  /**
   * 効果からビジュアル要素を抽出
   */
  private extractVisualElements(effects: string[]): string {
    const visualKeywords = [];

    for (const effect of effects) {
      // 色に関するキーワード
      if (effect.includes('青') || effect.includes('青い')) {
        visualKeywords.push('blue magical effects');
      }
      if (effect.includes('赤') || effect.includes('炎')) {
        visualKeywords.push('red fire effects');
      }
      if (effect.includes('金') || effect.includes('黄金')) {
        visualKeywords.push('golden gleaming');
      }
      if (effect.includes('緑')) {
        visualKeywords.push('green nature magic');
      }

      // 動きや現象
      if (effect.includes('踊') || effect.includes('ダンス')) {
        visualKeywords.push('dancing motion, flowing movement');
      }
      if (effect.includes('浮く') || effect.includes('宙')) {
        visualKeywords.push('floating objects, levitation');
      }
      if (effect.includes('光') || effect.includes('輝')) {
        visualKeywords.push('glowing light, radiant shine');
      }
      if (effect.includes('影')) {
        visualKeywords.push('shadow play, dark silhouettes');
      }
      if (effect.includes('煙')) {
        visualKeywords.push('mystical smoke, magical vapor');
      }

      // 動物や生物
      if (effect.includes('猫') || effect.includes('ネコ')) {
        visualKeywords.push('cat motif, feline magic');
      }
      if (effect.includes('鳥') || effect.includes('鷲') || effect.includes('鷹')) {
        visualKeywords.push('bird symbolism, flying creatures');
      }
      if (effect.includes('龍') || effect.includes('竜')) {
        visualKeywords.push('dragon imagery, serpentine power');
      }

      // 自然要素
      if (effect.includes('花') || effect.includes('桜')) {
        visualKeywords.push('flower petals, blooming nature');
      }
      if (effect.includes('雪') || effect.includes('氷')) {
        visualKeywords.push('ice crystals, frozen magic');
      }
      if (effect.includes('雷')) {
        visualKeywords.push('lightning bolts, electric energy');
      }
    }

    return visualKeywords.length > 0
      ? visualKeywords.join(', ')
      : 'magical particles, enchanted atmosphere';
  }

  /**
   * 呪文名からシンボルやモチーフを抽出
   */
  private extractSymbolism(spellName: string, description: string): string {
    const symbols = [];
    const combinedText = spellName + description;

    // 漢字から基本モチーフを推測
    if (combinedText.includes('火')) symbols.push('flame symbol');
    if (combinedText.includes('水')) symbols.push('water droplet');
    if (combinedText.includes('木')) symbols.push('tree branches');
    if (combinedText.includes('金')) symbols.push('metallic gleam');
    if (combinedText.includes('土')) symbols.push('earth crystal');
    if (combinedText.includes('雷')) symbols.push('lightning symbol');
    if (combinedText.includes('風')) symbols.push('wind spiral');
    if (combinedText.includes('光')) symbols.push('radiant orb');
    if (combinedText.includes('闇')) symbols.push('dark void');
    if (combinedText.includes('魔')) symbols.push('arcane circle');
    if (combinedText.includes('神')) symbols.push('divine halo');
    if (combinedText.includes('龍')) symbols.push('dragon motif');
    if (combinedText.includes('剣')) symbols.push('sword emblem');
    if (combinedText.includes('盾')) symbols.push('shield design');
    if (combinedText.includes('星')) symbols.push('star constellation');
    if (combinedText.includes('月')) symbols.push('crescent moon');
    if (combinedText.includes('花')) symbols.push('floral pattern');

    return symbols.length > 0
      ? symbols.slice(0, 3).join(', ') + ', spell card design'
      : 'mystical spell card, magical emblem, arcane design';
  }
}
