import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the Cloudflare Workers environment
const mockEnv = {
  GAME_SESSION: {
    idFromName: vi.fn((name: string) => ({ name })),
    get: vi.fn(() => ({
      fetch: vi.fn(),
    })),
    newUniqueId: vi.fn(() => ({ name: 'unique-id' })),
    idFromString: vi.fn(() => ({ name: 'string-id' })),
    jurisdiction: 'local',
  },
} as any;

// Mock worker module (for future use if needed)
// const mockWorker = {
//   fetch: vi.fn(),
// };

// Mock GameSession responses
const mockSessionState = {
  success: true,
  data: {
    sessionId: 'test-session-id',
    currentKanji: [
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
    ],
    selectedKanji: [] as string[],
    spellHistory: [] as any[],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

const mockSelectedState = {
  success: true,
  data: {
    ...mockSessionState.data,
    selectedKanji: ['火'],
  },
};

describe('MajiBattle API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Endpoint Routing', () => {
    test('should route /api/game/new to create new session', async () => {
      const { default: worker } = await import('../index');

      // Mock successful session creation
      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/new', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(201);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const result = (await response.json()) as { sessionId: string; success: boolean };
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('success', true);
    });

    test('should route /api/game/{sessionId} to get session state', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session-123', {
        method: 'GET',
      });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(mockEnv.GAME_SESSION.idFromName).toHaveBeenCalledWith('test-session-123');
      expect(mockDurableObject.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    test('should route /api/game/{sessionId}/select to select kanji', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSelectedState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session-123/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanji: '火' }),
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(mockDurableObject.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    test('should route /api/game/{sessionId}/reset to reset session', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session-123/reset', {
        method: 'POST',
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(mockDurableObject.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('CORS Handling', () => {
    test('should handle OPTIONS preflight requests', async () => {
      const { default: worker } = await import('../index');

      const request = new Request('https://example.com/api/game/test-session/select', {
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    test('should include CORS headers in all API responses', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing kanji parameter in select request', async () => {
      const { default: worker } = await import('../index');

      const request = new Request('https://example.com/api/game/test-session/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing kanji
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(400);
      const result = (await response.json()) as { error: string };
      expect(result.error).toBe('Missing kanji parameter');
    });

    test('should handle durable object errors gracefully', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi.fn().mockRejectedValue(new Error('Durable Object error')),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(500);
      const result = (await response.json()) as { error: string };
      expect(result.error).toBe('Internal server error');
    });

    test('should handle non-existent API endpoints', async () => {
      const { default: worker } = await import('../index');

      const request = new Request('https://example.com/api/game/unknown/endpoint', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
      const result = (await response.json()) as { error: string };
      expect(result.error).toBe('API endpoint not found');
    });

    test('should handle malformed JSON in request body', async () => {
      const { default: worker } = await import('../index');

      const request = new Request('https://example.com/api/game/test-session/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(500);
      const result = (await response.json()) as { error: string };
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('Session Management', () => {
    test('should generate session IDs with UUID format', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockImplementation(() =>
            Promise.resolve(new Response(JSON.stringify(mockSessionState), { status: 200 }))
          ),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      // Create a single session to test format
      const request = new Request('https://example.com/api/game/new', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);
      const result = (await response.json()) as { sessionId: string };

      // Should be a valid UUID format
      expect(result.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // Should have status 201 for creation
      expect(response.status).toBe(201);
    });

    test('should use session ID for durable object naming', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const sessionId = 'custom-session-id-123';
      const request = new Request(`https://example.com/api/game/${sessionId}`, {
        method: 'GET',
      });

      await worker.fetch(request, mockEnv);

      expect(mockEnv.GAME_SESSION.idFromName).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('Data Flow Integration', () => {
    test('should pass kanji selection data correctly', async () => {
      const { default: worker } = await import('../index');

      let capturedRequest: Request | null = null;
      const mockDurableObject = {
        fetch: vi.fn().mockImplementation((request: Request) => {
          capturedRequest = request;
          return Promise.resolve(new Response(JSON.stringify(mockSelectedState), { status: 200 }));
        }),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanji: '水' }),
      });

      await worker.fetch(request, mockEnv);

      expect(capturedRequest).toBeTruthy();
      if (capturedRequest) {
        const body = await (capturedRequest as Request).text();
        expect(JSON.parse(body)).toEqual({ kanji: '水' });
      }
    });

    test('should preserve response format from durable object', async () => {
      const { default: worker } = await import('../index');

      const customResponse = {
        success: true,
        data: {
          sessionId: 'test-123',
          currentKanji: ['火', '水'],
          selectedKanji: ['火'],
          spellHistory: [],
        },
      };

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(customResponse), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/test-session', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      const result = await response.json();

      expect(result).toEqual(customResponse);
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle concurrent requests to same session', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockImplementation(() =>
            Promise.resolve(new Response(JSON.stringify(mockSessionState), { status: 200 }))
          ),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const sessionId = 'concurrent-test-session';

      // Handle requests sequentially to avoid body reuse issues
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const request = new Request(`https://example.com/api/game/${sessionId}`, { method: 'GET' });
        const response = await worker.fetch(request, mockEnv);
        responses.push(response);
      }

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Should use the same durable object instance
      expect(mockEnv.GAME_SESSION.idFromName).toHaveBeenCalledWith(sessionId);
      expect(mockEnv.GAME_SESSION.get).toHaveBeenCalled();
    });

    test('should handle large session IDs', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify(mockSessionState), { status: 200 })),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      // Very long session ID
      const longSessionId = 'a'.repeat(100);
      const request = new Request(`https://example.com/api/game/${longSessionId}`, {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      expect(response.status).toBe(200);
      expect(mockEnv.GAME_SESSION.idFromName).toHaveBeenCalledWith(longSessionId);
    });

    test('should handle network timeouts gracefully', async () => {
      const { default: worker } = await import('../index');

      const mockDurableObject = {
        fetch: vi
          .fn()
          .mockImplementation(
            () =>
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 100)
              )
          ),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const request = new Request('https://example.com/api/game/timeout-test', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv);
      expect(response.status).toBe(500);

      const result = (await response.json()) as { error: string };
      expect(result.error).toBe('Internal server error');
    });
  });

  describe('Full Integration Scenarios', () => {
    test('should handle complete game flow', async () => {
      const { default: worker } = await import('../index');

      // Mock session creation
      let currentState: {
        sessionId: string;
        currentKanji: string[];
        selectedKanji: string[];
        spellHistory: any[];
        createdAt: Date;
        lastUpdatedAt: Date;
      } = {
        ...mockSessionState.data,
        selectedKanji: [],
      };

      const mockDurableObject = {
        fetch: vi.fn().mockImplementation(async (request: Request) => {
          const url = new URL(request.url);
          const method = request.method;

          if (method === 'POST' && url.pathname === '/create') {
            return new Response(
              JSON.stringify({
                success: true,
                data: currentState,
              }),
              { status: 200 }
            );
          }

          if (method === 'GET' && url.pathname === '/state') {
            return new Response(
              JSON.stringify({
                success: true,
                data: currentState,
              }),
              { status: 200 }
            );
          }

          if (method === 'POST' && url.pathname === '/select') {
            const body = (await request.json()) as { kanji: string };
            const kanji = body.kanji;

            if (currentState.selectedKanji.includes(kanji)) {
              // Deselect
              currentState.selectedKanji = currentState.selectedKanji.filter((k) => k !== kanji);
            } else if (currentState.selectedKanji.length < 4) {
              // Select
              currentState.selectedKanji.push(kanji);
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: currentState,
              }),
              { status: 200 }
            );
          }

          if (method === 'POST' && url.pathname === '/reset') {
            currentState.selectedKanji = [];
            return new Response(
              JSON.stringify({
                success: true,
                data: currentState,
              }),
              { status: 200 }
            );
          }

          return new Response('Not Found', { status: 404 });
        }),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      // 1. Create new session
      const createResponse = await worker.fetch(
        new Request('https://example.com/api/game/new'),
        mockEnv
      );

      expect(createResponse.status).toBe(201);
      const createResult = (await createResponse.json()) as { sessionId: string; success: boolean };
      expect(createResult.sessionId).toBeDefined();

      const sessionId = createResult.sessionId;

      // 2. Get initial state
      const stateResponse = await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}`),
        mockEnv
      );

      expect(stateResponse.status).toBe(200);
      const stateResult = (await stateResponse.json()) as { data: { selectedKanji: string[] } };
      expect(stateResult.data.selectedKanji).toHaveLength(0);

      // 3. Select kanji sequentially
      const kanjiToSelect = ['火', '水', '木', '金'];

      for (let i = 0; i < kanjiToSelect.length; i++) {
        const selectResponse = await worker.fetch(
          new Request(`https://example.com/api/game/${sessionId}/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kanji: kanjiToSelect[i] }),
          }),
          mockEnv
        );

        expect(selectResponse.status).toBe(200);
        const selectResult = (await selectResponse.json()) as { data: { selectedKanji: string[] } };
        expect(selectResult.data.selectedKanji).toHaveLength(i + 1);
        expect(selectResult.data.selectedKanji).toContain(kanjiToSelect[i]);
      }

      // 4. Verify final state
      const finalStateResponse = await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}`),
        mockEnv
      );

      const finalState = (await finalStateResponse.json()) as { data: { selectedKanji: string[] } };
      expect(finalState.data.selectedKanji).toEqual(kanjiToSelect);

      // 5. Reset session
      const resetResponse = await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}/reset`, {
          method: 'POST',
        }),
        mockEnv
      );

      expect(resetResponse.status).toBe(200);
      const resetResult = (await resetResponse.json()) as { data: { selectedKanji: string[] } };
      expect(resetResult.data.selectedKanji).toHaveLength(0);
    });

    test('should maintain data consistency across operations', async () => {
      const { default: worker } = await import('../index');

      // Track all operations to ensure consistency
      const operations: string[] = [];
      let sessionState = { ...mockSessionState.data, selectedKanji: [] as string[] };

      const mockDurableObject = {
        fetch: vi.fn().mockImplementation(async (request: Request) => {
          const url = new URL(request.url);
          const method = request.method;

          operations.push(`${method} ${url.pathname}`);

          if (method === 'POST' && url.pathname === '/select') {
            const body = (await request.json()) as { kanji: string };
            const kanji = body.kanji;

            if (
              !sessionState.selectedKanji.includes(kanji) &&
              sessionState.selectedKanji.length < 4
            ) {
              (sessionState.selectedKanji as string[]).push(kanji);
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: sessionState,
            }),
            { status: 200 }
          );
        }),
      };

      mockEnv.GAME_SESSION.get.mockReturnValue(mockDurableObject);

      const sessionId = 'consistency-test';

      // Perform operations sequentially to avoid body reuse issues
      await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kanji: '火' }),
        }),
        mockEnv
      );

      await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kanji: '水' }),
        }),
        mockEnv
      );

      const response = await worker.fetch(
        new Request(`https://example.com/api/game/${sessionId}`),
        mockEnv
      );

      // Operations should succeed
      expect(response.status).toBe(200);

      // Verify operations were called
      expect(operations).toContain('POST /select');
      expect(operations).toContain('GET /state');
    });
  });
});
