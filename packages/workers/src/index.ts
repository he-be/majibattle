// Cloudflare Workers サンプルアプリケーション

// Import proper GameSession implementation
// Export all versions - V3 for production deployments with SQL support
export { GameSession } from './durable-objects/GameSession';
export { GameSessionV2 } from './durable-objects/GameSessionV2';
export { GameSessionV3 } from './durable-objects/GameSessionV3';

import { SpellWithImageGenerationService } from './services/SpellWithImageGenerationService';

export const sampleData = ['Hello', 'World', 'AI', 'Driven', 'Development'];

export function getRandomItem(): string {
  const randomIndex = Math.floor(Math.random() * sampleData.length);
  return sampleData[randomIndex];
}

function generateGameHTML(): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>魔字武闘 - MajiBattle</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .game-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .game-header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
        }
        
        .game-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .game-subtitle {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .selected-kanji-area {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            min-height: 80px;
        }
        
        .selected-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 15px;
            color: #555;
        }
        
        .selected-kanji-container {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .selected-kanji {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: #667eea;
            color: white;
            font-size: 1.5rem;
            font-weight: bold;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            position: relative;
        }
        
        .selected-kanji .order {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff6b6b;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .kanji-grid-area {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            flex: 1;
        }
        
        .kanji-grid-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 15px;
            color: #555;
            text-align: center;
        }
        
        .kanji-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
            gap: 10px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .kanji-item {
            aspect-ratio: 1;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            user-select: none;
            position: relative;
        }
        
        .kanji-item:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .kanji-item.selected {
            background: #667eea;
            color: white;
            border-color: #667eea;
            transform: scale(0.95);
        }
        
        .kanji-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #f5f5f5;
        }
        
        .kanji-item.disabled:hover {
            transform: none;
            box-shadow: none;
            border-color: #e0e0e0;
        }
        
        .control-area {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .control-button {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .reset-button {
            background: #ff6b6b;
            color: white;
        }
        
        .reset-button:hover {
            background: #ff5252;
            transform: translateY(-1px);
        }
        
        .create-spell-button {
            background: #4ecdc4;
            color: white;
        }
        
        .create-spell-button:hover {
            background: #26a69a;
            transform: translateY(-1px);
        }
        
        .create-spell-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .status-message {
            text-align: center;
            margin-top: 15px;
            padding: 10px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .status-message.info {
            background: #e3f2fd;
            color: #1976d2;
        }
        
        .status-message.warning {
            background: #fff3e0;
            color: #f57c00;
        }
        
        .status-message.success {
            background: #e8f5e8;
            color: #388e3c;
        }
        
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 600px) {
            .game-container {
                padding: 15px;
            }
            
            .game-title {
                font-size: 2rem;
            }
            
            .kanji-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            
            .kanji-item {
                font-size: 1.5rem;
            }
            
            .selected-kanji {
                width: 50px;
                height: 50px;
                font-size: 1.3rem;
            }
        }
        
        @media (max-width: 400px) {
            .game-title {
                font-size: 1.7rem;
            }
            
            .kanji-item {
                font-size: 1.2rem;
            }
            
            .control-button {
                padding: 10px 20px;
                font-size: 0.9rem;
            }
            
            .spell-result {
                padding: 20px;
                max-height: 95vh;
            }
            
            .spell-name {
                font-size: 1.5em;
            }
            
            .spell-effects li {
                font-size: 0.9em;
                padding: 8px;
            }
        }
        
        /* Spell Modal Styles */
        .spell-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        
        .spell-result {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.5s ease;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
        }
        
        .spell-result::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .spell-result.useless::before {
            background: linear-gradient(90deg, #9ca3af 0%, #6b7280 100%);
        }
        
        .spell-result.rare::before {
            background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
        }
        
        .spell-result.epic::before {
            background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
        }
        
        .spell-result.legendary::before {
            background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
            animation: shimmer 2s linear infinite;
        }
        
        .spell-name {
            font-size: 2em;
            margin-bottom: 10px;
            color: #1f2937;
            text-align: center;
        }
        
        .spell-rarity {
            text-align: center;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            color: #6b7280;
        }
        
        .spell-result.useless .spell-rarity { color: #6b7280; }
        .spell-result.rare .spell-rarity { color: #3b82f6; }
        .spell-result.epic .spell-rarity { color: #8b5cf6; }
        .spell-result.legendary .spell-rarity { color: #f59e0b; }
        
        .spell-description {
            font-size: 1.1em;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .spell-image {
            width: 100%;
            max-width: 400px;
            height: auto;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            margin: 20px auto;
            display: block;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .spell-image:hover {
            transform: scale(1.02);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
        }
        
        .image-loading {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-style: italic;
        }
        
        .image-error {
            text-align: center;
            padding: 15px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            color: #dc2626;
            font-size: 0.9em;
            margin: 10px 0;
        }
        
        .image-generation-status {
            text-align: center;
            padding: 10px;
            margin: 10px 0;
            border-radius: 8px;
            font-size: 0.9em;
        }
        
        .image-generation-status.generating {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #dbeafe;
        }
        
        .image-generation-status.success {
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        
        .image-generation-status.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }
        
        .spell-details {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 10px;
        }
        
        .spell-stat {
            text-align: center;
        }
        
        .spell-stat .label {
            display: block;
            font-size: 0.9em;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .spell-stat .value {
            display: block;
            font-size: 1.5em;
            font-weight: bold;
            color: #1f2937;
        }
        
        .spell-effects h3 {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .spell-effects ul {
            list-style: none;
            padding: 0;
        }
        
        .spell-effects li {
            padding: 10px;
            margin-bottom: 8px;
            background: #f3f4f6;
            border-radius: 8px;
            border-left: 3px solid #667eea;
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.5;
        }
        
        .close-button {
            position: sticky;
            bottom: 0;
            margin-top: 20px;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1em;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .close-button:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <header class="game-header">
            <h1 class="game-title">魔字武闘</h1>
            <p class="game-subtitle">4つの漢字を選んで呪文を作ろう！</p>
        </header>
        
        <section class="selected-kanji-area">
            <h2 class="selected-title">選択した漢字 (<span id="selected-count">0</span>/4)</h2>
            <div class="selected-kanji-container" id="selected-kanji-container">
                <!-- 選択された漢字がここに表示される -->
            </div>
        </section>
        
        <section class="kanji-grid-area">
            <h2 class="kanji-grid-title">漢字を選択してください</h2>
            <div class="kanji-grid" id="kanji-grid">
                <div class="loading">漢字を読み込み中...</div>
            </div>
        </section>
        
        <section class="control-area">
            <button class="control-button reset-button" id="reset-button">リセット</button>
            <button class="control-button create-spell-button" id="create-spell-button" disabled>呪文作成</button>
        </section>
        
        <div class="status-message info" id="status-message">
            20個の漢字から4つを選んで呪文を作成しましょう！
        </div>
    </div>

    <script>
        class MajiBattleGame {
            constructor() {
                this.selectedKanji = [];
                this.availableKanji = [];
                this.maxSelection = 4;
                this.sessionId = null;
                
                this.elements = {
                    kanjiGrid: document.getElementById('kanji-grid'),
                    selectedContainer: document.getElementById('selected-kanji-container'),
                    selectedCount: document.getElementById('selected-count'),
                    resetButton: document.getElementById('reset-button'),
                    createSpellButton: document.getElementById('create-spell-button'),
                    statusMessage: document.getElementById('status-message')
                };
                
                this.init();
            }
            
            async init() {
                await this.loadKanji();
                this.bindEvents();
                this.updateUI();
            }
            
            async loadKanji() {
                try {
                    // セッションIDを取得または新規作成
                    await this.ensureSession();
                    
                    // セッション状態を取得して漢字をロード
                    const response = await fetch(\`/api/game/\${this.sessionId}\`);
                    if (!response.ok) {
                        if (response.status === 404) {
                            // セッションが見つからない場合は、古いIDを削除して新規作成
                            console.log('Session not found, creating new session...');
                            localStorage.removeItem('majibattle-session-id');
                            this.sessionId = null;
                            await this.ensureSession();
                            
                            // 再度セッション状態を取得
                            const retryResponse = await fetch(\`/api/game/\${this.sessionId}\`);
                            if (!retryResponse.ok) {
                                throw new Error('Failed to load session after retry');
                            }
                            const retryResult = await retryResponse.json();
                            if (retryResult.success && retryResult.data) {
                                this.availableKanji = retryResult.data.currentKanji;
                                this.selectedKanji = retryResult.data.selectedKanji;
                                this.renderKanjiGrid();
                                return;
                            }
                        }
                        throw new Error('Failed to load session');
                    }
                    
                    const result = await response.json();
                    if (result.success && result.data) {
                        this.availableKanji = result.data.currentKanji;
                        this.selectedKanji = result.data.selectedKanji;
                    } else {
                        throw new Error(result.error || 'Failed to load kanji');
                    }
                    
                    this.renderKanjiGrid();
                } catch (error) {
                    console.error('Load kanji error:', error);
                    this.showStatus('漢字の読み込みに失敗しました', 'warning');
                    // フォールバック：プレースホルダー漢字
                    this.availableKanji = [
                        '火', '水', '木', '金', '土', '光', '闇', '風', '雷', '氷',
                        '剣', '盾', '魔', '法', '術', '攻', '守', '癒', '破', '創'
                    ];
                    this.renderKanjiGrid();
                }
            }
            
            async ensureSession() {
                // localStorage からセッションIDを取得
                this.sessionId = localStorage.getItem('majibattle-session-id');
                
                if (!this.sessionId) {
                    // 新しいセッションを作成
                    const response = await fetch('/api/game/new');
                    if (!response.ok) {
                        throw new Error('Failed to create session');
                    }
                    
                    const result = await response.json();
                    this.sessionId = result.sessionId;
                    localStorage.setItem('majibattle-session-id', this.sessionId);
                }
            }
            
            renderKanjiGrid() {
                this.elements.kanjiGrid.innerHTML = '';
                
                this.availableKanji.forEach((kanji, index) => {
                    const kanjiElement = document.createElement('div');
                    kanjiElement.className = 'kanji-item';
                    kanjiElement.textContent = kanji;
                    kanjiElement.dataset.kanji = kanji;
                    kanjiElement.dataset.index = index;
                    
                    kanjiElement.addEventListener('click', async () => await this.selectKanji(kanji));
                    
                    this.elements.kanjiGrid.appendChild(kanjiElement);
                });
            }
            
            async selectKanji(kanji) {
                // 既に選択済みかチェック
                if (this.selectedKanji.includes(kanji)) {
                    await this.deselectKanji(kanji);
                    return;
                }
                
                // 選択数制限チェック
                if (this.selectedKanji.length >= this.maxSelection) {
                    this.showStatus('最大4つまでしか選択できません', 'warning');
                    return;
                }
                
                try {
                    // API経由で漢字を選択
                    const response = await fetch(\`/api/game/\${this.sessionId}/select\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ kanji }),
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        this.selectedKanji = result.data.selectedKanji;
                        this.updateUI();
                        
                        if (this.selectedKanji.length === this.maxSelection) {
                            this.showStatus('4つの漢字が選択されました！呪文を作成できます', 'success');
                        } else {
                            this.showStatus(\`あと\${this.maxSelection - this.selectedKanji.length}つ選択してください\`, 'info');
                        }
                    } else {
                        this.showStatus(result.error || '選択に失敗しました', 'warning');
                    }
                } catch (error) {
                    console.error('Select kanji error:', error);
                    this.showStatus('ネットワークエラーが発生しました', 'warning');
                }
            }
            
            async deselectKanji(kanji) {
                const index = this.selectedKanji.indexOf(kanji);
                if (index > -1) {
                    try {
                        // API経由で漢字を再選択（トグル効果）
                        const response = await fetch(\`/api/game/\${this.sessionId}/select\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ kanji }),
                        });
                        
                        const result = await response.json();
                        
                        if (result.success && result.data) {
                            this.selectedKanji = result.data.selectedKanji;
                            this.updateUI();
                            this.showStatus(\`「\${kanji}」の選択を解除しました\`, 'info');
                        } else {
                            this.showStatus(result.error || '選択解除に失敗しました', 'warning');
                        }
                    } catch (error) {
                        console.error('Deselect kanji error:', error);
                        this.showStatus('ネットワークエラーが発生しました', 'warning');
                    }
                }
            }
            
            updateUI() {
                this.updateSelectedKanjiDisplay();
                this.updateKanjiGridState();
                this.updateControls();
            }
            
            updateSelectedKanjiDisplay() {
                this.elements.selectedCount.textContent = this.selectedKanji.length;
                
                this.elements.selectedContainer.innerHTML = '';
                
                this.selectedKanji.forEach((kanji, index) => {
                    const selectedElement = document.createElement('div');
                    selectedElement.className = 'selected-kanji';
                    selectedElement.innerHTML = \`
                        \${kanji}
                        <span class="order">\${index + 1}</span>
                    \`;
                    selectedElement.addEventListener('click', async () => await this.deselectKanji(kanji));
                    this.elements.selectedContainer.appendChild(selectedElement);
                });
            }
            
            updateKanjiGridState() {
                const kanjiItems = this.elements.kanjiGrid.querySelectorAll('.kanji-item');
                
                kanjiItems.forEach(item => {
                    const kanji = item.dataset.kanji;
                    const isSelected = this.selectedKanji.includes(kanji);
                    const isMaxReached = this.selectedKanji.length >= this.maxSelection;
                    
                    item.classList.toggle('selected', isSelected);
                    item.classList.toggle('disabled', !isSelected && isMaxReached);
                });
            }
            
            updateControls() {
                const hasSelection = this.selectedKanji.length > 0;
                const canCreateSpell = this.selectedKanji.length === this.maxSelection;
                
                this.elements.createSpellButton.disabled = !canCreateSpell;
            }
            
            async reset() {
                try {
                    const response = await fetch(\`/api/game/\${this.sessionId}/reset\`, {
                        method: 'POST',
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        this.availableKanji = result.data.currentKanji;
                        this.selectedKanji = result.data.selectedKanji;
                        this.renderKanjiGrid();
                        this.updateUI();
                        this.showStatus('選択をリセットしました', 'info');
                    } else {
                        this.showStatus(result.error || 'リセットに失敗しました', 'warning');
                    }
                } catch (error) {
                    console.error('Reset error:', error);
                    this.showStatus('ネットワークエラーが発生しました', 'warning');
                }
            }
            
            async createSpell() {
                if (this.selectedKanji.length !== this.maxSelection) {
                    this.showStatus('4つの漢字を選択してください', 'warning');
                    return;
                }
                
                this.showStatus('呪文を生成中...', 'info');
                this.elements.createSpellButton.disabled = true;
                
                try {
                    const response = await fetch(\`/api/game/\${this.sessionId}/spell\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        this.displaySpellResult(result.data);
                    } else {
                        this.showStatus(result.error || '呪文生成に失敗しました', 'warning');
                        this.elements.createSpellButton.disabled = false;
                    }
                } catch (error) {
                    console.error('Create spell error:', error);
                    this.showStatus('ネットワークエラーが発生しました', 'warning');
                    this.elements.createSpellButton.disabled = false;
                }
            }
            
            displaySpellResult(spellResult) {
                // 呪文結果を表示（拡張SpellResult対応 + 画像生成対応）
                const spellModal = document.createElement('div');
                spellModal.className = 'spell-modal';
                
                // 画像表示エリアのHTML生成
                let imageSection = '';
                if (spellResult.imageGenerationEnabled) {
                    if (spellResult.generatedImage) {
                        // 画像生成成功
                        imageSection = \`
                            <div class="image-generation-status success">
                                ✅ AI画像生成完了 (生成時間: \${Math.round(spellResult.generatedImage.generationTime / 1000)}秒)
                            </div>
                            <img src="\${spellResult.generatedImage.imageUrl}" alt="Generated spell image" class="spell-image">
                        \`;
                    } else if (spellResult.imageGenerationError) {
                        // 画像生成失敗
                        imageSection = \`
                            <div class="image-generation-status error">
                                ❌ AI画像生成に失敗しました: \${spellResult.imageGenerationError}
                            </div>
                        \`;
                    } else {
                        // 画像生成中
                        imageSection = \`
                            <div class="image-generation-status generating">
                                🎨 AI画像を生成中...
                            </div>
                        \`;
                    }
                }
                
                spellModal.innerHTML = \`
                    <div class="spell-result \${spellResult.rarity}">
                        <h2 class="spell-name">\${spellResult.spell}</h2>
                        \${spellResult.kana ? \`<div class="spell-kana" style="text-align: center; font-size: 0.9em; color: #666; margin-bottom: 10px;">\${spellResult.kana}</div>\` : ''}
                        <div class="spell-rarity">\${this.getRarityText(spellResult.rarity)}</div>
                        \${imageSection}
                        <p class="spell-description">\${spellResult.description}</p>
                        \${spellResult.origin ? \`<div class="spell-origin" style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 0.9em; color: #555;"><strong>由来:</strong> \${spellResult.origin}</div>\` : ''}
                        <div class="spell-details">
                            <div class="spell-stat">
                                <span class="label">属性:</span>
                                <span class="value">\${spellResult.element}</span>
                            </div>
                            <div class="spell-stat">
                                <span class="label">威力:</span>
                                <span class="value">\${spellResult.power}/10</span>
                            </div>
                        </div>
                        <div class="spell-effects">
                            <h3>効果:</h3>
                            <ul>
                                \${spellResult.effects.map(effect => \`<li>\${effect}</li>\`).join('')}
                            </ul>
                        </div>
                        <button class="close-button" id="close-spell-modal">閉じる</button>
                    </div>
                \`;
                
                document.body.appendChild(spellModal);
                
                // 閉じるボタンのクリックイベント
                const closeButton = document.getElementById('close-spell-modal');
                closeButton.addEventListener('click', () => {
                    spellModal.remove();
                    this.reset();
                    document.removeEventListener('keydown', handleEscKey);
                });
                
                // モーダルクリックでも閉じる（背景クリック）
                spellModal.addEventListener('click', (e) => {
                    if (e.target === spellModal) {
                        spellModal.remove();
                        this.reset();
                        document.removeEventListener('keydown', handleEscKey);
                    }
                });
                
                // ESCキーで閉じる
                const handleEscKey = (e) => {
                    if (e.key === 'Escape') {
                        spellModal.remove();
                        this.reset();
                        document.removeEventListener('keydown', handleEscKey);
                    }
                };
                document.addEventListener('keydown', handleEscKey);
            }
            
            getRarityText(rarity) {
                const rarityTexts = {
                    // 従来スタイル
                    useless: 'ゴミ',
                    common: 'コモン',
                    rare: 'レア',
                    epic: 'エピック',
                    legendary: 'レジェンダリー',
                    // 民俗学スタイル
                    Common: 'コモン',
                    Uncommon: 'アンコモン',
                    Rare: 'レア',
                    Epic: 'エピック',
                    Legendary: 'レジェンダリー'
                };
                return rarityTexts[rarity] || rarity;
            }
            
            bindEvents() {
                this.elements.resetButton.addEventListener('click', async () => await this.reset());
                this.elements.createSpellButton.addEventListener('click', async () => await this.createSpell());
            }
            
            showStatus(message, type = 'info') {
                this.elements.statusMessage.textContent = message;
                this.elements.statusMessage.className = \`status-message \${type}\`;
            }
        }
        
        // ゲーム開始
        document.addEventListener('DOMContentLoaded', () => {
            window.majiBattleGame = new MajiBattleGame();
        });
    </script>
</body>
</html>
  `;
}

/**
 * 工事中画像を配信
 */
function serveUnderConstructionImage(): Response {
  // シンプルな「工事中」SVG画像を埋め込み
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 768" fill="none">
  <rect width="512" height="768" fill="#f3f4f6"/>
  
  <!-- 背景パターン -->
  <defs>
    <pattern id="stripes" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
      <rect width="10" height="20" fill="#fbbf24"/>
      <rect x="10" width="10" height="20" fill="#f59e0b"/>
    </pattern>
  </defs>
  
  <!-- フレーム -->
  <rect x="20" y="20" width="472" height="728" rx="15" fill="white" stroke="#e5e7eb" stroke-width="2"/>
  
  <!-- 工事中アイコン -->
  <g transform="translate(256, 200)">
    <!-- ヘルメット -->
    <circle cx="0" cy="0" r="60" fill="#fbbf24"/>
    <path d="M -50 -10 Q -50 -40, 0 -50 Q 50 -40, 50 -10" fill="#f59e0b"/>
    <rect x="-60" y="-10" width="120" height="10" rx="5" fill="#f59e0b"/>
    
    <!-- 歯車 -->
    <g transform="translate(0, 150)">
      <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite"/>
      <path d="M 0,-40 L 10,-38 L 10,-25 L 20,-20 L 28,-28 L 38,-20 L 25,-10 L 38,-10 L 40,0 L 38,10 L 25,10 L 20,20 L 28,28 L 20,38 L 10,25 L 10,38 L 0,40 L -10,38 L -10,25 L -20,20 L -28,28 L -38,20 L -25,10 L -38,10 L -40,0 L -38,-10 L -25,-10 L -20,-20 L -28,-28 L -20,-38 L -10,-25 L -10,-38 Z" fill="#6b7280"/>
      <circle cx="0" cy="0" r="15" fill="#4b5563"/>
    </g>
  </g>
  
  <!-- テキスト -->
  <text x="256" y="420" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="#1f2937">
    AI画像生成準備中
  </text>
  
  <text x="256" y="460" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#6b7280">
    Under Construction
  </text>
  
  <!-- メッセージ -->
  <text x="256" y="520" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">
    画像生成サービスは現在利用できません
  </text>
  
  <text x="256" y="545" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#9ca3af">
    しばらくお待ちください
  </text>
  
  <!-- 装飾的な境界線 -->
  <rect x="40" y="600" width="432" height="50" fill="url(#stripes)" rx="10" opacity="0.3"/>
  
  <!-- バージョン情報 -->
  <text x="256" y="720" text-anchor="middle" font-family="monospace" font-size="10" fill="#d1d5db">
    MajiBattle v1.0 - AI Image Generation Module
  </text>
</svg>
  `.trim();

  return new Response(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// Cloudflare Workers Environment interface
interface Env {
  // eslint-disable-next-line no-undef
  GAME_SESSION: DurableObjectNamespace;
  // Workers Secrets（本番）または.dev.vars（ローカル開発）
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  // AI画像生成関連の設定
  STABLE_DIFFUSION_API_ENDPOINT?: string;
  CF_CLIENT_ID?: string;
  CF_SECRET?: string;
  IMAGE_GENERATION_ENABLED?: string; // "true" | "false"
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ルートパスの処理 - MajiBattleゲーム画面
    if (url.pathname === '/') {
      const html = generateGameHTML();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 静的アセット配信（代替画像）
    if (url.pathname === '/images/underconstruction.svg') {
      return serveUnderConstructionImage();
    }

    // GameSession API endpoints
    if (url.pathname.startsWith('/api/game/')) {
      return await handleGameAPI(request, env, url);
    }

    // APIエンドポイント（JSON）
    if (url.pathname === '/api/random') {
      const message = getRandomItem();

      return new Response(JSON.stringify({ message }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 404 Not Found
    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Handle GameSession API requests
 */
async function handleGameAPI(request: Request, env: Env, url: URL): Promise<Response> {
  const method = request.method;
  const pathSegments = url.pathname.split('/').filter(Boolean); // ['api', 'game', ...]

  try {
    // CORS headers for all API responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /api/game/new - Create new session
    if (method === 'GET' && pathSegments[2] === 'new') {
      return await createNewGameSession(env, corsHeaders);
    }

    // Session-specific endpoints: /api/game/{sessionId}/...
    if (pathSegments.length >= 3) {
      const sessionId = pathSegments[2];

      // GET /api/game/{sessionId} - Get session state
      if (method === 'GET' && pathSegments.length === 3) {
        return await getGameSessionState(env, sessionId, corsHeaders);
      }

      // POST /api/game/{sessionId}/select - Select kanji
      if (method === 'POST' && pathSegments[3] === 'select') {
        return await selectKanji(request, env, sessionId, corsHeaders);
      }

      // POST /api/game/{sessionId}/reset - Reset session
      if (method === 'POST' && pathSegments[3] === 'reset') {
        return await resetGameSession(env, sessionId, corsHeaders);
      }

      // POST /api/game/{sessionId}/spell - Generate spell
      if (method === 'POST' && pathSegments[3] === 'spell') {
        return await generateSpell(request, env, sessionId, corsHeaders);
      }
    }

    // API endpoint not found
    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('GameAPI error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Create a new game session
 */
async function createNewGameSession(
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Generate a unique session ID
  const sessionId = crypto.randomUUID();

  // Get Durable Object instance
  const durableObjectId = env.GAME_SESSION.idFromName(sessionId);
  const durableObject = env.GAME_SESSION.get(durableObjectId);

  // Create new session
  const response = await durableObject.fetch(
    new Request('https://fake-host/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  );

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  const sessionData = (await response.json()) as { success: boolean; data: unknown };

  return new Response(
    JSON.stringify({
      sessionId,
      success: sessionData.success,
      data: {
        ...(sessionData.data || {}),
        sessionId, // Use the consistent sessionId from the Durable Object namespace
      },
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

/**
 * Get game session state
 */
async function getGameSessionState(
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const durableObjectId = env.GAME_SESSION.idFromName(sessionId);
  const durableObject = env.GAME_SESSION.get(durableObjectId);

  const response = await durableObject.fetch(
    new Request('https://fake-host/state', {
      method: 'GET',
    })
  );

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Select a kanji in the session
 */
async function selectKanji(
  request: Request,
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as { kanji: string };

  if (!body.kanji) {
    return new Response(JSON.stringify({ error: 'Missing kanji parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const durableObjectId = env.GAME_SESSION.idFromName(sessionId);
  const durableObject = env.GAME_SESSION.get(durableObjectId);

  const response = await durableObject.fetch(
    new Request('https://fake-host/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kanji: body.kanji }),
    })
  );

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Reset game session
 */
async function resetGameSession(
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const durableObjectId = env.GAME_SESSION.idFromName(sessionId);
  const durableObject = env.GAME_SESSION.get(durableObjectId);

  const response = await durableObject.fetch(
    new Request('https://fake-host/reset', {
      method: 'POST',
    })
  );

  const responseData = await response.text();

  return new Response(responseData, {
    status: response.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Generate spell using AI
 */
async function generateSpell(
  request: Request,
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get current session state to verify kanji selection
    const durableObjectId = env.GAME_SESSION.idFromName(sessionId);
    const durableObject = env.GAME_SESSION.get(durableObjectId);

    const stateResponse = await durableObject.fetch(
      new Request('https://fake-host/state', {
        method: 'GET',
      })
    );

    if (!stateResponse.ok) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const sessionData = (await stateResponse.json()) as {
      success: boolean;
      data?: { selectedKanji?: string[] };
    };

    if (!sessionData.success || !sessionData.data) {
      return new Response(JSON.stringify({ error: 'Invalid session state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const selectedKanji = sessionData.data.selectedKanji;

    if (!selectedKanji || selectedKanji.length !== 4) {
      return new Response(JSON.stringify({ error: 'Please select exactly 4 kanji' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Initialize spell + image generation service
    let geminiApiKey: string = '';

    if (env.GEMINI_API_KEY) {
      console.log('Using GEMINI_API_KEY from environment');
      geminiApiKey = env.GEMINI_API_KEY;
    } else {
      console.warn('⚠️ GEMINI_API_KEY not available, using fallback generation');
    }

    // 画像生成設定を構築
    const imageConfig = {
      enabled: env.IMAGE_GENERATION_ENABLED === 'true',
      apiEndpoint: env.STABLE_DIFFUSION_API_ENDPOINT || '',
      cfClientId: env.CF_CLIENT_ID,
      cfSecret: env.CF_SECRET,
      fallbackOnError: true, // 画像生成失敗時はテキストのみで継続
    };

    console.log('🎨 Image generation config:', {
      enabled: imageConfig.enabled,
      hasEndpoint: !!imageConfig.apiEndpoint,
      hasCfAuth: !!(imageConfig.cfClientId && imageConfig.cfSecret),
    });

    const spellWithImageService = new SpellWithImageGenerationService(
      geminiApiKey,
      env.GEMINI_MODEL,
      imageConfig
    );

    // Generate spell with image
    const spellResult = await spellWithImageService.generateSpellWithImage(selectedKanji);

    // TODO: Store spell in session history (implement in next task)

    return new Response(
      JSON.stringify({
        success: true,
        data: spellResult,
        cached: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Spell generation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate spell',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}
