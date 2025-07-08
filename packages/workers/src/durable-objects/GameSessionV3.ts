import { GameSessionState, APIResponse } from '@majibattle/shared';
import { generateSessionId } from '@majibattle/shared';
import { KanjiDataManager } from '../data/KanjiDataManager';

export class GameSessionV3 {
  private kanjiManager: KanjiDataManager;
  private initialized: boolean = false;
  private initError: Error | null = null;

  constructor(
    // eslint-disable-next-line no-undef
    private state: DurableObjectState,
    // eslint-disable-next-line no-undef
    private env: { GAME_SESSION: DurableObjectNamespace }
  ) {
    this.kanjiManager = new KanjiDataManager();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Ensure database is initialized
    if (!this.initialized && !this.initError) {
      try {
        console.log('GameSessionV3: Starting database initialization...');
        await this.initializeDatabase();
        this.initialized = true;
        console.log('GameSessionV3: Database initialization successful');
      } catch (e: any) {
        console.error('FATAL: GameSessionV3 Database Initialization Failed:', e);
        console.error('Error stack:', e.stack);
        console.error('SQL availability check:', typeof this.state.storage.sql);
        this.initError = e;
      }
    }

    // Check initialization status
    if (this.initError) {
      console.error(
        'GameSessionV3 fetch called but initialization failed:',
        this.initError.message
      );
      return new Response(
        JSON.stringify({
          error: 'Durable Object initialization failed',
          details: this.initError.message,
          stack: this.initError.stack,
          sqlAvailable: typeof this.state.storage.sql,
          version: 'V3',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
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
    } catch (e: any) {
      console.error('GameSessionV3 error:', e);
      return this.errorResponse('Internal server error', 500);
    }
  }

  private async initializeDatabase(): Promise<void> {
    console.log('initializeDatabase V3: Starting SQL database setup...');
    console.log('initializeDatabase V3: state.storage available:', !!this.state.storage);
    console.log('initializeDatabase V3: state.storage.sql available:', !!this.state.storage.sql);
    console.log('initializeDatabase V3: SQL exec type:', typeof this.state.storage.sql?.exec);

    try {
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
      console.log('initializeDatabase V3: Table creation successful');
    } catch (e: any) {
      console.error('initializeDatabase V3: SQL exec failed:', e);
      throw e;
    }
  }

  private async createSession(): Promise<Response> {
    const sessionId = generateSessionId();
    const timestamp = Date.now();
    const randomKanji = this.kanjiManager.generateRandomKanji(20);

    const sessionData: GameSessionState = {
      sessionId,
      currentKanji: randomKanji,
      selectedKanji: [],
      spellHistory: [],
      createdAt: new Date(timestamp),
      lastUpdatedAt: new Date(timestamp),
    };

    // Store in SQL database
    await this.state.storage.sql.exec(
      'INSERT OR REPLACE INTO game_sessions (session_id, current_kanji, selected_kanji, spell_history, created_at, last_updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      sessionId,
      JSON.stringify(randomKanji),
      JSON.stringify([]),
      JSON.stringify([]),
      timestamp,
      timestamp
    );

    return this.successResponse(sessionData);
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
    const sessionData: GameSessionState = {
      sessionId: row.session_id as string,
      currentKanji: JSON.parse(row.current_kanji as string),
      selectedKanji: JSON.parse(row.selected_kanji as string),
      spellHistory: JSON.parse(row.spell_history as string),
      createdAt: new Date(row.created_at as number),
      lastUpdatedAt: new Date(row.last_updated_at as number),
    };

    return this.successResponse(sessionData);
  }

  private async updateSelection(kanji: string): Promise<Response> {
    const stateResponse = await this.getState();
    if (!stateResponse.ok) {
      return stateResponse;
    }

    const { data: currentState } = (await stateResponse.json()) as { data: GameSessionState };
    if (!currentState) {
      return this.errorResponse('Session state not found', 404);
    }

    // Validate kanji is available in current selection
    if (!currentState.currentKanji.includes(kanji)) {
      return this.errorResponse('Kanji not available in current selection', 400);
    }

    // Handle selection/deselection logic
    let updatedSelection: string[];
    if (currentState.selectedKanji.includes(kanji)) {
      // Deselect kanji
      updatedSelection = currentState.selectedKanji.filter((k: string) => k !== kanji);
    } else {
      // Select kanji (check limit)
      if (currentState.selectedKanji.length >= 4) {
        return this.errorResponse('Maximum 4 kanji can be selected', 400);
      }
      updatedSelection = [...currentState.selectedKanji, kanji];
    }

    // Update database
    const timestamp = Date.now();
    await this.state.storage.sql.exec(
      'UPDATE game_sessions SET selected_kanji = ?, last_updated_at = ? WHERE session_id = ?',
      JSON.stringify(updatedSelection),
      timestamp,
      currentState.sessionId
    );

    const updatedState: GameSessionState = {
      ...currentState,
      selectedKanji: updatedSelection,
      lastUpdatedAt: new Date(timestamp),
    };

    return this.successResponse(updatedState);
  }

  private async resetSession(): Promise<Response> {
    const stateResponse = await this.getState();
    if (!stateResponse.ok) {
      return stateResponse;
    }

    const { data: currentState } = (await stateResponse.json()) as { data: GameSessionState };
    if (!currentState) {
      return this.errorResponse('Session state not found', 404);
    }

    // Generate new random kanji and reset selection
    const timestamp = Date.now();
    const newRandomKanji = this.kanjiManager.generateRandomKanji(20);

    await this.state.storage.sql.exec(
      'UPDATE game_sessions SET current_kanji = ?, selected_kanji = ?, last_updated_at = ? WHERE session_id = ?',
      JSON.stringify(newRandomKanji),
      JSON.stringify([]),
      timestamp,
      currentState.sessionId
    );

    const resetState: GameSessionState = {
      ...currentState,
      currentKanji: newRandomKanji,
      selectedKanji: [],
      lastUpdatedAt: new Date(timestamp),
    };

    return this.successResponse(resetState);
  }

  private successResponse(data: any): Response {
    const response: APIResponse<any> = {
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
