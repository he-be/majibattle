import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GameSession } from '../durable-objects/GameSession';
import { GameSessionState, APIResponse } from '@majibattle/shared';

// Mock DurableObjectState and SqlStorage
const mockSqlStorage = {
  exec: vi.fn(),
};

const mockState = {
  storage: {
    sql: mockSqlStorage,
  },
};

const mockEnv = {
  // eslint-disable-next-line no-undef
  GAME_SESSION: {} as DurableObjectNamespace,
};

describe('GameSession Durable Object', () => {
  let gameSession: GameSession;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameSession = new GameSession(mockState as any, mockEnv as any);
  });

  describe('Database Initialization', () => {
    test('should initialize database table on first access', async () => {
      mockSqlStorage.exec.mockResolvedValueOnce({ toArray: () => [] });

      const request = new Request('http://localhost/create', { method: 'POST' });
      await gameSession.fetch(request);

      expect(mockSqlStorage.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS game_sessions')
      );
    });
  });

  describe('createSession', () => {
    test('should create new session with random kanji', async () => {
      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [] }); // INSERT

      const request = new Request('http://localhost/create', { method: 'POST' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(200);

      const result = (await response.json()) as APIResponse<GameSessionState>;
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      if (result.data) {
        expect(result.data.sessionId).toBeDefined();
        expect(result.data.currentKanji).toHaveLength(20);
        expect(result.data.selectedKanji).toEqual([]);
        expect(result.data.spellHistory).toEqual([]);
      }
    });
  });

  describe('getState', () => {
    test('should return existing session state', async () => {
      const mockSessionData = {
        session_id: 'test-session-id',
        current_kanji: '["火","水","木"]',
        selected_kanji: '["火"]',
        spell_history: '[]',
        created_at: Date.now(),
        last_updated_at: Date.now(),
      };

      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [mockSessionData] }); // SELECT

      const request = new Request('http://localhost/state', { method: 'GET' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(200);

      const result = (await response.json()) as APIResponse<GameSessionState>;
      expect(result.success).toBe(true);
      expect(result.data?.sessionId).toBe('test-session-id');
      expect(result.data?.currentKanji).toEqual(['火', '水', '木']);
      expect(result.data?.selectedKanji).toEqual(['火']);
    });

    test('should return 404 when no session exists', async () => {
      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [] }); // SELECT

      const request = new Request('http://localhost/state', { method: 'GET' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(404);

      const result = (await response.json()) as APIResponse<null>;
      expect(result.success).toBe(false);
      expect(result.error).toBe('No session found');
    });
  });

  describe('updateSelection', () => {
    const mockSessionData = {
      session_id: 'test-session-id',
      current_kanji: '["火","水","木","金","土"]',
      selected_kanji: '["火"]',
      spell_history: '[]',
      created_at: Date.now(),
      last_updated_at: Date.now(),
    };

    test('should add valid kanji to selection', async () => {
      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [mockSessionData] }) // SELECT
        .mockResolvedValueOnce({ toArray: () => [] }); // UPDATE

      const request = new Request('http://localhost/select', {
        method: 'POST',
        body: JSON.stringify({ kanji: '水' }),
      });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(200);

      const result = (await response.json()) as APIResponse<GameSessionState>;
      expect(result.success).toBe(true);
      expect(result.data?.selectedKanji).toEqual(['火', '水']);
    });

    test('should toggle kanji selection (deselect if already selected)', async () => {
      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [mockSessionData] }) // SELECT
        .mockResolvedValueOnce({ toArray: () => [] }); // UPDATE

      const request = new Request('http://localhost/select', {
        method: 'POST',
        body: JSON.stringify({ kanji: '火' }),
      });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(200);

      const result = (await response.json()) as APIResponse<GameSessionState>;
      expect(result.success).toBe(true);
      expect(result.data?.selectedKanji).toEqual([]); // Should be deselected
    });

    test('should reject kanji not in current selection', async () => {
      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [mockSessionData] }); // SELECT

      const request = new Request('http://localhost/select', {
        method: 'POST',
        body: JSON.stringify({ kanji: '雷' }),
      });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(400);

      const result = (await response.json()) as APIResponse<null>;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Kanji not available in current selection');
    });

    test('should reject selection when already 4 kanji selected', async () => {
      const fullSelectionData = {
        ...mockSessionData,
        selected_kanji: '["火","水","木","金"]',
      };

      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [fullSelectionData] }); // SELECT

      const request = new Request('http://localhost/select', {
        method: 'POST',
        body: JSON.stringify({ kanji: '土' }),
      });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(400);

      const result = (await response.json()) as APIResponse<null>;
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum 4 kanji can be selected');
    });
  });

  describe('resetSession', () => {
    test('should reset session with new kanji and clear selections', async () => {
      const mockSessionData = {
        session_id: 'test-session-id',
        current_kanji: '["火","水","木"]',
        selected_kanji: '["火","水"]',
        spell_history: '[]',
        created_at: Date.now(),
        last_updated_at: Date.now(),
      };

      mockSqlStorage.exec
        .mockResolvedValueOnce({ toArray: () => [] }) // CREATE TABLE
        .mockResolvedValueOnce({ toArray: () => [mockSessionData] }) // SELECT
        .mockResolvedValueOnce({ toArray: () => [] }); // UPDATE

      const request = new Request('http://localhost/reset', { method: 'POST' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(200);

      const result = (await response.json()) as APIResponse<GameSessionState>;
      expect(result.success).toBe(true);
      expect(result.data?.selectedKanji).toEqual([]);
      expect(result.data?.currentKanji).toHaveLength(20);
      expect(result.data?.sessionId).toBe('test-session-id');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockSqlStorage.exec.mockRejectedValueOnce(new Error('Database error'));

      const request = new Request('http://localhost/create', { method: 'POST' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(500);

      const result = (await response.json()) as any;
      expect(result.error).toBe('Durable Object initialization failed');
      expect(result.details).toBe('Database error');
      expect(result.stack).toBeDefined();
      expect(result.sqlAvailable).toBeDefined();
    });

    test('should return 404 for unknown endpoints', async () => {
      mockSqlStorage.exec.mockResolvedValueOnce({ toArray: () => [] });

      const request = new Request('http://localhost/unknown', { method: 'GET' });
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(404);

      const result = (await response.json()) as APIResponse<null>;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });
});
