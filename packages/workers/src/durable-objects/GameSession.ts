import { GameSessionState, APIResponse } from '@majibattle/shared';
import { generateSessionId, validateKanjiSelection } from '@majibattle/shared';
import { KanjiDataManager } from '../data/KanjiDataManager';

export class GameSession {
  private kanjiManager: KanjiDataManager;

  constructor(
    // eslint-disable-next-line no-undef
    private state: DurableObjectState,

    private env: Env
  ) {
    this.kanjiManager = new KanjiDataManager();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      // Initialize database on first access
      await this.initializeDatabase();

      switch (method) {
        case 'POST':
          if (url.pathname.endsWith('/create')) {
            return await this.createSession();
          }
          if (url.pathname.endsWith('/select')) {
            const body = (await request.json()) as { kanji: string };
            return await this.updateSelection(body.kanji);
          }
          if (url.pathname.endsWith('/reset')) {
            return await this.resetSession();
          }
          break;

        case 'GET':
          if (url.pathname.endsWith('/state')) {
            return await this.getState();
          }
          break;

        default:
          return this.errorResponse('Method not allowed', 405);
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      console.error('GameSession error:', error);
      return this.errorResponse('Internal server error', 500);
    }
  }

  private async initializeDatabase(): Promise<void> {
    await this.state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        current_kanji TEXT NOT NULL,
        selected_kanji TEXT NOT NULL,
        spell_history TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_updated_at INTEGER NOT NULL
      )
    `);
  }

  private async createSession(): Promise<Response> {
    const sessionId = generateSessionId();
    const now = Date.now();

    // Generate initial 20 random kanji using KanjiDataManager
    const currentKanji = this.kanjiManager.generateRandomKanji(20);

    const sessionState: GameSessionState = {
      sessionId,
      currentKanji,
      selectedKanji: [],
      spellHistory: [],
      createdAt: new Date(now),
      lastUpdatedAt: new Date(now),
    };

    await this.state.storage.sql.exec(
      'INSERT OR REPLACE INTO game_sessions (session_id, current_kanji, selected_kanji, spell_history, created_at, last_updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      sessionId,
      JSON.stringify(currentKanji),
      JSON.stringify([]),
      JSON.stringify([]),
      now,
      now
    );

    return this.successResponse(sessionState);
  }

  private async getState(): Promise<Response> {
    const result = await this.state.storage.sql.exec(
      'SELECT * FROM game_sessions ORDER BY last_updated_at DESC LIMIT 1'
    );

    const rows = result.toArray();
    if (!rows.length) {
      return this.errorResponse('No session found', 404);
    }

    const row = rows[0];
    const sessionState: GameSessionState = {
      sessionId: row.session_id as string,
      currentKanji: JSON.parse(row.current_kanji as string),
      selectedKanji: JSON.parse(row.selected_kanji as string),
      spellHistory: JSON.parse(row.spell_history as string),
      createdAt: new Date(row.created_at as number),
      lastUpdatedAt: new Date(row.last_updated_at as number),
    };

    return this.successResponse(sessionState);
  }

  private async updateSelection(kanji: string): Promise<Response> {
    const stateResponse = await this.getState();
    if (!stateResponse.ok) {
      return stateResponse;
    }

    const { data: currentState } = (await stateResponse.json()) as APIResponse<GameSessionState>;
    if (!currentState) {
      return this.errorResponse('Session state not found', 404);
    }

    // Validate kanji selection
    if (!validateKanjiSelection(currentState.selectedKanji, kanji)) {
      return this.errorResponse('Invalid kanji selection: maximum 4 or already selected', 400);
    }

    if (!currentState.currentKanji.includes(kanji)) {
      return this.errorResponse('Kanji not available in current selection', 400);
    }

    const updatedSelectedKanji = [...currentState.selectedKanji, kanji];
    const now = Date.now();

    await this.state.storage.sql.exec(
      'UPDATE game_sessions SET selected_kanji = ?, last_updated_at = ? WHERE session_id = ?',
      JSON.stringify(updatedSelectedKanji),
      now,
      currentState.sessionId
    );

    const updatedState: GameSessionState = {
      ...currentState,
      selectedKanji: updatedSelectedKanji,
      lastUpdatedAt: new Date(now),
    };

    return this.successResponse(updatedState);
  }

  private async resetSession(): Promise<Response> {
    const stateResponse = await this.getState();
    if (!stateResponse.ok) {
      return stateResponse;
    }

    const { data: currentState } = (await stateResponse.json()) as APIResponse<GameSessionState>;
    if (!currentState) {
      return this.errorResponse('Session state not found', 404);
    }

    const now = Date.now();
    const newKanji = this.kanjiManager.generateRandomKanji(20);

    await this.state.storage.sql.exec(
      'UPDATE game_sessions SET current_kanji = ?, selected_kanji = ?, last_updated_at = ? WHERE session_id = ?',
      JSON.stringify(newKanji),
      JSON.stringify([]),
      now,
      currentState.sessionId
    );

    const resetState: GameSessionState = {
      ...currentState,
      currentKanji: newKanji,
      selectedKanji: [],
      lastUpdatedAt: new Date(now),
    };

    return this.successResponse(resetState);
  }

  private successResponse<T>(data: T): Response {
    const response: APIResponse<T> = {
      success: true,
      data,
    };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private errorResponse(error: string, status: number): Response {
    const response: APIResponse<null> = {
      success: false,
      error,
    };
    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Type definitions for Cloudflare Workers
interface Env {
  // eslint-disable-next-line no-undef
  GAME_SESSION: DurableObjectNamespace;
}
