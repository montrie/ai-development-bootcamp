import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../services/api';
import App from '../App';

vi.mock('../services/api');
vi.mock('../services/auth', () => ({
  getToken: () => 'fake-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getRole: () => null,
}));

const todo = (id: number, text: string, done = false): api.Todo => ({ id, text, done });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk')]);
  vi.mocked(api.fetchUserProfile).mockResolvedValue({ sortMode: 'CREATED_ASC' });
  vi.mocked(api.updateSortMode).mockResolvedValue(undefined);
});

describe('Sort Mode Selector — F-59–F-65', () => {
  it('renders the sort mode selector', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    expect(document.querySelector('[data-testid="sort-mode-select"]')).toBeInTheDocument();
  });

  it('shows the active sort mode on load from user profile', async () => {
    vi.mocked(api.fetchUserProfile).mockResolvedValue({ sortMode: 'DUE_DATE_EARLIEST_FIRST' });
    render(<App />);
    await screen.findByText('Buy milk');
    const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
    expect(select.value).toBe('DUE_DATE_EARLIEST_FIRST');
  });

  it('defaults to CREATED_ASC when user profile returns CREATED_ASC', async () => {
    vi.mocked(api.fetchUserProfile).mockResolvedValue({ sortMode: 'CREATED_ASC' });
    render(<App />);
    await screen.findByText('Buy milk');
    const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
    expect(select.value).toBe('CREATED_ASC');
  });

  it('selecting a different sort mode calls updateSortMode then re-fetches todos', async () => {
    vi.mocked(api.fetchTodos)
      .mockResolvedValueOnce([todo(1, 'Zebra'), todo(2, 'Apple')])
      .mockResolvedValueOnce([todo(2, 'Apple'), todo(1, 'Zebra')]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Zebra');

    const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
    await user.selectOptions(select, 'ALPHA_ASC');

    expect(api.updateSortMode).toHaveBeenCalledWith('ALPHA_ASC');
    await waitFor(() => expect(api.fetchTodos).toHaveBeenCalledTimes(2));
  });

  it('the select is disabled while updateSortMode is in flight', async () => {
    let resolveUpdate!: () => void;
    vi.mocked(api.updateSortMode).mockReturnValue(
      new Promise<void>((res) => { resolveUpdate = res; })
    );
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');

    const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
    user.selectOptions(select, 'ALPHA_ASC');

    await waitFor(() => expect(select).toBeDisabled());

    resolveUpdate();
    await waitFor(() => expect(select).not.toBeDisabled());
  });

  it('all sort mode options are present', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('CREATED_ASC');
    expect(options).toContain('CREATED_DESC');
    expect(options).toContain('DUE_DATE_EARLIEST_FIRST');
    expect(options).toContain('DUE_DATE_LATEST_FIRST');
    expect(options).toContain('ALPHA_ASC');
    expect(options).toContain('ALPHA_DESC');
    expect(options).toContain('CUSTOM');
  });
});
