import { test, expect } from '@playwright/test';

test.describe('MajiBattle Game E2E Tests', () => {
  test('should display MajiBattle game interface', async ({ page }) => {
    // Navigate to the game page
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle('魔字武闘 - MajiBattle');

    // Check main game elements
    await expect(page.locator('.game-title')).toHaveText('魔字武闘');
    await expect(page.locator('.game-subtitle')).toContainText('4つの漢字を選んで呪文を作ろう');
    
    // Check kanji grid is present and loaded
    await expect(page.locator('.kanji-grid')).toBeVisible();
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Check control buttons
    await expect(page.locator('#reset-button')).toBeVisible();
    await expect(page.locator('#create-spell-button')).toBeVisible();
    await expect(page.locator('#create-spell-button')).toBeDisabled();
    
    // Check status message
    await expect(page.locator('#status-message')).toContainText('20個の漢字から4つを選んで');
    
    // Check selected count is initially 0
    await expect(page.locator('#selected-count')).toHaveText('0');
  });

  test('should allow kanji selection and spell creation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for kanji grid to load via API
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Select 4 kanji (wait for API responses)
    const kanjiItems = page.locator('.kanji-item');
    
    for (let i = 0; i < 4; i++) {
      await kanjiItems.nth(i).click();
      await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
      await expect(page.locator('#selected-count')).toHaveText(String(i + 1));
    }
    
    // Check spell creation button is enabled
    await expect(page.locator('#create-spell-button')).toBeEnabled();
    
    // Create spell and wait for spell response
    await Promise.all([
      page.locator('#create-spell-button').click(),
      page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/spell'))
    ]);
    
    // Wait for spell modal to appear
    await expect(page.locator('.spell-modal')).toBeVisible();
    await expect(page.locator('.spell-result')).toBeVisible();
    
    // Wait for the auto-reset to happen (modal will auto-close and reset)
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/reset'));
    
    // Check that selection is reset
    await expect(page.locator('#selected-count')).toHaveText('0');
    await expect(page.locator('#status-message')).toContainText('選択をリセットしました');
  });

  test('should handle kanji deselection', async ({ page }) => {
    await page.goto('/');
    
    // Wait for kanji grid to load via API
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Select a kanji
    const firstKanji = page.locator('.kanji-item').nth(0);
    await firstKanji.click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    await expect(page.locator('#selected-count')).toHaveText('1');
    
    // Deselect by clicking selected kanji in the selected area
    await expect(page.locator('.selected-kanji')).toHaveCount(1);
    await page.locator('.selected-kanji').click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    await expect(page.locator('#selected-count')).toHaveText('0');
  });

  test('should prevent selecting more than 4 kanji', async ({ page }) => {
    await page.goto('/');
    
    // Wait for kanji grid to load via API
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Select 4 kanji
    const kanjiItems = page.locator('.kanji-item');
    for (let i = 0; i < 4; i++) {
      await kanjiItems.nth(i).click();
      await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    }
    
    await expect(page.locator('#selected-count')).toHaveText('4');
    
    // Try to select a 5th kanji
    await kanjiItems.nth(4).click();
    
    // Should still be 4 and show warning message
    await expect(page.locator('#selected-count')).toHaveText('4');
    await expect(page.locator('#status-message')).toContainText('最大4つまでしか選択できません');
  });

  test('should reset selection', async ({ page }) => {
    await page.goto('/');
    
    // Wait for kanji grid to load via API
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Select some kanji
    const kanjiItems = page.locator('.kanji-item');
    await kanjiItems.nth(0).click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    await kanjiItems.nth(1).click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    await expect(page.locator('#selected-count')).toHaveText('2');
    
    // Reset selection
    await page.locator('#reset-button').click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/reset'));
    
    // Check that selection is cleared
    await expect(page.locator('#selected-count')).toHaveText('0');
    await expect(page.locator('#status-message')).toContainText('選択をリセットしました');
  });

  test('should return valid JSON from API endpoint', async ({ page }) => {
    // Make a direct request to the API endpoint
    const response = await page.request.get('/api/random');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/json');
    expect(response.headers()['access-control-allow-origin']).toBe('*');

    const jsonData = await response.json();
    expect(jsonData).toHaveProperty('message');
    expect(['Hello', 'World', 'AI', 'Driven', 'Development']).toContain(jsonData.message);
  });

  test('should return 404 for unknown paths', async ({ page }) => {
    const response = await page.request.get('/unknown-path');
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  test('should have proper cache headers', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-cache');
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('should handle GameSession API endpoints', async ({ page }) => {
    // Test new session creation
    const newSessionResponse = await page.request.get('/api/game/new');
    expect(newSessionResponse.status()).toBe(201);
    expect(newSessionResponse.headers()['content-type']).toBe('application/json');
    expect(newSessionResponse.headers()['access-control-allow-origin']).toBe('*');
    
    const sessionData = await newSessionResponse.json();
    expect(sessionData).toHaveProperty('sessionId');
    expect(sessionData).toHaveProperty('success', true);
    
    // Test session state retrieval
    const sessionId = sessionData.sessionId;
    const stateResponse = await page.request.get(`/api/game/${sessionId}`);
    expect(stateResponse.status()).toBe(200);
    
    const stateData = await stateResponse.json();
    expect(stateData.success).toBe(true);
    expect(stateData.data).toHaveProperty('currentKanji');
    expect(stateData.data.currentKanji).toHaveLength(20);
    expect(stateData.data).toHaveProperty('selectedKanji');
    expect(stateData.data.selectedKanji).toHaveLength(0);
  });

  test('should handle session persistence across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial load and kanji generation
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.kanji-item')).toHaveCount(20);
    
    // Select a kanji
    const firstKanji = page.locator('.kanji-item').nth(0);
    const firstKanjiText = await firstKanji.textContent();
    await firstKanji.click();
    await page.waitForResponse(response => response.url().includes('/api/game/') && response.url().includes('/select'));
    await expect(page.locator('#selected-count')).toHaveText('1');
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if session is restored (selection should be maintained)
    await expect(page.locator('#selected-count')).toHaveText('1');
    await expect(page.locator('.selected-kanji')).toHaveCount(1);
    
    // Verify the same kanji is still selected
    const selectedKanjiText = await page.locator('.selected-kanji').textContent();
    expect(selectedKanjiText).toContain(firstKanjiText);
  });
});
