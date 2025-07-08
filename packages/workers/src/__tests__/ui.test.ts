import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment for testing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockElement {
  innerHTML = '';
  textContent = '';
  className = '';
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  classList = {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn((className: string, force?: boolean) => {
      if (force !== undefined) {
        if (force) {
          this.classList.add(className);
        } else {
          this.classList.remove(className);
        }
      }
    }),
    contains: vi.fn(),
  };

  children: MockElement[] = [];
  eventListeners: Record<string, (() => void)[]> = {};

  addEventListener(event: string, handler: () => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  appendChild(child: MockElement) {
    this.children.push(child);
  }

  querySelectorAll(selector: string): MockElement[] {
    // 簡単なセレクター実装
    if (selector === '.kanji-item') {
      return this.children.filter((child) => child.className.includes('kanji-item'));
    }
    return [];
  }

  click() {
    if (this.eventListeners.click) {
      this.eventListeners.click.forEach((handler) => handler());
    }
  }
}

// Mock document is available for future use if needed
// const mockDocument = {
//   getElementById: vi.fn((_id: string) => new MockElement()),
//   createElement: vi.fn((_tag: string) => new MockElement()),
//   addEventListener: vi.fn(),
// };

// UI ロジックのテスト用クラス（DOMに依存しない部分を抽出）
class MajiBattleGameLogic {
  selectedKanji: string[] = [];
  availableKanji: string[] = [];
  maxSelection = 4;

  constructor() {
    this.availableKanji = [
      '火',
      '水',
      '木',
      '金',
      '土',
      '光',
      '闇',
      '風',
      '雷',
      '氷',
      '剣',
      '盾',
      '魔',
      '法',
      '術',
      '攻',
      '守',
      '癒',
      '破',
      '創',
    ];
  }

  selectKanji(kanji: string): { success: boolean; message: string; type: string } {
    // 既に選択済みかチェック
    if (this.selectedKanji.includes(kanji)) {
      return this.deselectKanji(kanji);
    }

    // 選択数制限チェック
    if (this.selectedKanji.length >= this.maxSelection) {
      return {
        success: false,
        message: '最大4つまでしか選択できません',
        type: 'warning',
      };
    }

    // 漢字を選択
    this.selectedKanji.push(kanji);

    if (this.selectedKanji.length === this.maxSelection) {
      return {
        success: true,
        message: '4つの漢字が選択されました！呪文を作成できます',
        type: 'success',
      };
    } else {
      return {
        success: true,
        message: `あと${this.maxSelection - this.selectedKanji.length}つ選択してください`,
        type: 'info',
      };
    }
  }

  deselectKanji(kanji: string): { success: boolean; message: string; type: string } {
    const index = this.selectedKanji.indexOf(kanji);
    if (index > -1) {
      this.selectedKanji.splice(index, 1);
      return {
        success: true,
        message: `「${kanji}」の選択を解除しました`,
        type: 'info',
      };
    }
    return {
      success: false,
      message: '選択されていない漢字です',
      type: 'warning',
    };
  }

  reset(): { success: boolean; message: string; type: string } {
    this.selectedKanji = [];
    return {
      success: true,
      message: '選択をリセットしました',
      type: 'info',
    };
  }

  createSpell(): { success: boolean; message: string; type: string; spell?: string } {
    if (this.selectedKanji.length !== this.maxSelection) {
      return {
        success: false,
        message: '4つの漢字を選択してください',
        type: 'warning',
      };
    }

    const spell = this.selectedKanji.join('');
    return {
      success: true,
      message: `呪文「${spell}」を作成しました！`,
      type: 'success',
      spell,
    };
  }

  canCreateSpell(): boolean {
    return this.selectedKanji.length === this.maxSelection;
  }

  isKanjiSelected(kanji: string): boolean {
    return this.selectedKanji.includes(kanji);
  }

  isMaxSelectionReached(): boolean {
    return this.selectedKanji.length >= this.maxSelection;
  }

  getSelectedCount(): number {
    return this.selectedKanji.length;
  }

  getAvailableKanji(): string[] {
    return [...this.availableKanji];
  }

  getSelectedKanji(): string[] {
    return [...this.selectedKanji];
  }
}

describe('MajiBattle UI Logic', () => {
  let game: MajiBattleGameLogic;

  beforeEach(() => {
    game = new MajiBattleGameLogic();
  });

  describe('Initial State', () => {
    test('should start with empty selection', () => {
      expect(game.getSelectedCount()).toBe(0);
      expect(game.getSelectedKanji()).toEqual([]);
    });

    test('should have 20 available kanji', () => {
      expect(game.getAvailableKanji()).toHaveLength(20);
    });

    test('should not allow spell creation initially', () => {
      expect(game.canCreateSpell()).toBe(false);
    });

    test('should not have reached max selection initially', () => {
      expect(game.isMaxSelectionReached()).toBe(false);
    });
  });

  describe('Kanji Selection', () => {
    test('should select a single kanji successfully', () => {
      const result = game.selectKanji('火');

      expect(result.success).toBe(true);
      expect(result.type).toBe('info');
      expect(game.getSelectedCount()).toBe(1);
      expect(game.isKanjiSelected('火')).toBe(true);
    });

    test('should select multiple kanji in order', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');

      expect(game.getSelectedKanji()).toEqual(['火', '水', '木']);
      expect(game.getSelectedCount()).toBe(3);
    });

    test('should prevent selecting the same kanji twice', () => {
      game.selectKanji('火');
      const result = game.selectKanji('火');

      expect(result.success).toBe(true);
      expect(result.type).toBe('info');
      expect(result.message).toContain('選択を解除しました');
      expect(game.getSelectedCount()).toBe(0);
    });

    test('should allow exactly 4 kanji selection', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      const result = game.selectKanji('金');

      expect(result.success).toBe(true);
      expect(result.type).toBe('success');
      expect(result.message).toContain('4つの漢字が選択されました');
      expect(game.getSelectedCount()).toBe(4);
      expect(game.canCreateSpell()).toBe(true);
    });

    test('should prevent selecting more than 4 kanji', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      game.selectKanji('金');

      const result = game.selectKanji('土');

      expect(result.success).toBe(false);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('最大4つまでしか選択できません');
      expect(game.getSelectedCount()).toBe(4);
    });

    test('should track max selection state correctly', () => {
      expect(game.isMaxSelectionReached()).toBe(false);

      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      expect(game.isMaxSelectionReached()).toBe(false);

      game.selectKanji('金');
      expect(game.isMaxSelectionReached()).toBe(true);
    });
  });

  describe('Kanji Deselection', () => {
    test('should deselect kanji successfully', () => {
      game.selectKanji('火');
      game.selectKanji('水');

      const result = game.deselectKanji('火');

      expect(result.success).toBe(true);
      expect(result.type).toBe('info');
      expect(game.getSelectedKanji()).toEqual(['水']);
      expect(game.getSelectedCount()).toBe(1);
    });

    test('should handle deselecting non-selected kanji', () => {
      const result = game.deselectKanji('火');

      expect(result.success).toBe(false);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('選択されていない漢字です');
    });

    test('should maintain order when deselecting middle kanji', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');

      game.deselectKanji('水');

      expect(game.getSelectedKanji()).toEqual(['火', '木']);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all selections', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');

      const result = game.reset();

      expect(result.success).toBe(true);
      expect(result.type).toBe('info');
      expect(game.getSelectedCount()).toBe(0);
      expect(game.getSelectedKanji()).toEqual([]);
      expect(game.canCreateSpell()).toBe(false);
    });
  });

  describe('Spell Creation', () => {
    test('should create spell with 4 selected kanji', () => {
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      game.selectKanji('金');

      const result = game.createSpell();

      expect(result.success).toBe(true);
      expect(result.type).toBe('success');
      expect(result.spell).toBe('火水木金');
      expect(result.message).toContain('呪文「火水木金」を作成しました');
    });

    test('should prevent spell creation with less than 4 kanji', () => {
      game.selectKanji('火');
      game.selectKanji('水');

      const result = game.createSpell();

      expect(result.success).toBe(false);
      expect(result.type).toBe('warning');
      expect(result.message).toContain('4つの漢字を選択してください');
      expect(result.spell).toBeUndefined();
    });

    test('should create different spells based on selection order', () => {
      // First spell
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      game.selectKanji('金');

      const result1 = game.createSpell();
      expect(result1.spell).toBe('火水木金');

      // Reset and create different spell
      game.reset();
      game.selectKanji('金');
      game.selectKanji('木');
      game.selectKanji('水');
      game.selectKanji('火');

      const result2 = game.createSpell();
      expect(result2.spell).toBe('金木水火');
      expect(result1.spell).not.toBe(result2.spell);
    });
  });

  describe('Game State Validation', () => {
    test('should correctly identify selected kanji', () => {
      game.selectKanji('火');
      game.selectKanji('水');

      expect(game.isKanjiSelected('火')).toBe(true);
      expect(game.isKanjiSelected('水')).toBe(true);
      expect(game.isKanjiSelected('木')).toBe(false);
    });

    test('should handle edge cases gracefully', () => {
      // Empty string
      const result1 = game.selectKanji('');
      expect(result1.success).toBe(true); // 空文字も有効として扱う

      // 非存在漢字（実際のKanjiDataManagerでバリデーション予定）
      const result2 = game.selectKanji('存在しない');
      expect(result2.success).toBe(true); // UIレベルでは許可、バックエンドで検証
    });
  });

  describe('UI State Management', () => {
    test('should provide correct status messages for different states', () => {
      // Initial state
      expect(game.getSelectedCount()).toBe(0);

      // First selection
      const result1 = game.selectKanji('火');
      expect(result1.message).toContain('あと3つ選択してください');

      // Second selection
      const result2 = game.selectKanji('水');
      expect(result2.message).toContain('あと2つ選択してください');

      // Third selection
      const result3 = game.selectKanji('木');
      expect(result3.message).toContain('あと1つ選択してください');

      // Fourth selection (complete)
      const result4 = game.selectKanji('金');
      expect(result4.message).toContain('4つの漢字が選択されました');
    });

    test('should handle rapid selection/deselection correctly', () => {
      // Rapid selection
      game.selectKanji('火');
      game.selectKanji('水');
      game.selectKanji('木');
      game.selectKanji('金');

      expect(game.getSelectedCount()).toBe(4);

      // Rapid deselection
      game.deselectKanji('金');
      game.deselectKanji('木');

      expect(game.getSelectedCount()).toBe(2);
      expect(game.getSelectedKanji()).toEqual(['火', '水']);
    });
  });
});
