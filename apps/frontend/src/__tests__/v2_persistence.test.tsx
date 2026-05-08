import { render, screen } from '@testing-library/react';
import * as api from '../services/api';
import App from '../App';

vi.mock('../services/api');
vi.mock('../services/auth', () => ({ getToken: () => 'fake-token', setToken: vi.fn(), clearToken: vi.fn(), getRole: () => null }));

const todo = (id: number, text: string, done = false) => ({ id, text, done });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([]);
});

describe('Database Persistence', () => {
  it('calls fetchTodos on mount', () => {
    render(<App />);
    expect(api.fetchTodos).toHaveBeenCalledTimes(1);
  });

  it('renders todos returned by fetchTodos', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk')]);
    render(<App />);
    await screen.findByText('Buy milk');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('renders the server-unavailable notice when fetchTodos rejects', async () => {
    vi.mocked(api.fetchTodos).mockRejectedValue(new Error('Network error'));
    render(<App />);
    await screen.findByText(/could not reach the server/i);
  });

  it('does not render the server-unavailable notice when fetchTodos succeeds', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([]);
    render(<App />);
    await screen.findByText('No tasks yet — add one above!');
    expect(screen.queryByText(/could not reach the server/i)).not.toBeInTheDocument();
  });
});
