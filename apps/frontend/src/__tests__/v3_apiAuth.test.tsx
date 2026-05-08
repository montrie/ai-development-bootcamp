import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../services/api';
import * as auth from '../services/auth';

vi.mock('../services/auth', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: { reload: vi.fn() },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.getToken).mockReturnValue('test-token');
  global.fetch = vi.fn();
});

describe('API auth headers', () => {
  it('fetchTodos sends Bearer token header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);
    await fetchTodos();
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('fetchTodos 401 response calls clearToken', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    await expect(fetchTodos()).rejects.toThrow();
    expect(vi.mocked(auth.clearToken)).toHaveBeenCalled();
  });

  it('createTodo sends Bearer token header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, text: 'Buy milk', done: false }),
    } as Response);
    await createTodo('Buy milk');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('updateTodo sends Bearer token header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, text: 'Buy milk', done: true }),
    } as Response);
    await updateTodo(1, true);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('deleteTodo sends Bearer token header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    await deleteTodo(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });
});
