import { render, screen } from '@testing-library/react';
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

const todo = (
  id: number,
  text: string,
  done = false,
  dueDate: string | null = null
): api.Todo => ({ id, text, done, dueDate });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false, null)]);
  vi.mocked(api.editTodo).mockResolvedValue(todo(1, 'Buy oat milk', false, null));
});

describe('Edit Todo — F-47–F-56', () => {
  it('each todo item shows an Edit button', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('clicking Edit shows the edit input pre-populated with current text', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    expect(editInput).toBeInTheDocument();
    expect(editInput.value).toBe('Buy milk');
  });

  it('clicking Save calls editTodo with updated text', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, 'Buy oat milk');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.editTodo).toHaveBeenCalledWith(1, { text: 'Buy oat milk', dueDate: null });
  });

  it('pressing Enter saves the edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, 'Buy oat milk');
    await user.keyboard('{Enter}');
    expect(api.editTodo).toHaveBeenCalledWith(1, { text: 'Buy oat milk', dueDate: null });
  });

  it('clicking Cancel exits edit mode without calling editTodo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(api.editTodo).not.toHaveBeenCalled();
    expect(document.querySelector('.edit-input')).not.toBeInTheDocument();
  });

  it('pressing Escape exits edit mode without calling editTodo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    await user.type(editInput, 'Buy oat milk');
    await user.keyboard('{Escape}');
    expect(api.editTodo).not.toHaveBeenCalled();
    expect(document.querySelector('.edit-input')).not.toBeInTheDocument();
  });

  it('saving with empty text marks input invalid and does not call editTodo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    await user.clear(editInput);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(api.editTodo).not.toHaveBeenCalled();
    expect(editInput).toHaveClass('invalid');
  });

  it('opening a second item edit closes the first', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Buy milk', false, null),
      todo(2, 'Call dentist', false, null),
    ]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await screen.findByText('Call dentist');

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);
    expect(document.querySelectorAll('.edit-input')).toHaveLength(1);

    await user.click(editButtons[1]);
    expect(document.querySelectorAll('.edit-input')).toHaveLength(1);
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    expect(editInput.value).toBe('Call dentist');
  });
});
