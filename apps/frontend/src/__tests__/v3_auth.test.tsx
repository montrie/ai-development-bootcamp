import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../api';
import * as auth from '../auth';
import App from '../App';

vi.mock('../api');
vi.mock('../auth', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

const mockGetToken = vi.mocked(auth.getToken);
const mockSetToken = vi.mocked(auth.setToken);
const mockClearToken = vi.mocked(auth.clearToken);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([]);
});

describe('Auth — unauthenticated view', () => {
  it('shows login form by default when not authenticated', () => {
    mockGetToken.mockReturnValue(null);
    render(<App />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('switching to register tab shows register form', async () => {
    mockGetToken.mockReturnValue(null);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /register/i }));
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
});

describe('Auth — login', () => {
  it('stores token and shows todo list after successful login', async () => {
    mockGetToken.mockReturnValue(null);
    vi.mocked(api.loginUser).mockResolvedValue('test.jwt.token');
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(mockSetToken).toHaveBeenCalledWith('test.jwt.token'));
    await screen.findByRole('button', { name: /log out/i });
  });
});

describe('Auth — register', () => {
  it('stores token and shows todo list after successful registration', async () => {
    mockGetToken.mockReturnValue(null);
    vi.mocked(api.registerUser).mockResolvedValue('test.jwt.token');
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /register/i }));
    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => expect(mockSetToken).toHaveBeenCalledWith('test.jwt.token'));
    await screen.findByRole('button', { name: /log out/i });
  });
});

describe('Auth — logout', () => {
  it('clears token and shows login form after logout', async () => {
    mockGetToken.mockReturnValue('existing.jwt.token');
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: /log out/i });
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(mockClearToken).toHaveBeenCalled();
    await screen.findByRole('button', { name: /log in/i });
  });
});
