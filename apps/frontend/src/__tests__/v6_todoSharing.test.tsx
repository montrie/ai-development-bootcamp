import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../services/api';
import App from '../App';
import TodoItem from '../components/TodoItem';

vi.mock('../services/api', () => ({
  fetchTodos: vi.fn(),
  shareTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  editTodo: vi.fn(),
}));
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
  sharedBy: string | null = null
): api.Todo => ({ id, text, done, sharedBy });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([]);
});

describe('V6 Todo Sharing', () => {
  it('Share Todos button renders and toggles panel', async () => {
    const user = userEvent.setup();
    render(<App />);

    const shareBtn = document.getElementById('share-todos-button') as HTMLElement;
    expect(shareBtn).toBeInTheDocument();
    expect(shareBtn.textContent).toBe('Share Todos');

    await user.click(shareBtn);
    expect(document.getElementById('sharing-panel')).toBeInTheDocument();
    expect(shareBtn.textContent).toBe('Back');

    await user.click(shareBtn);
    expect(document.getElementById('sharing-panel')).not.toBeInTheDocument();
    expect(shareBtn.textContent).toBe('Share Todos');
  });

  it('sharing panel shows own todos as selectable, shared todos as non-selectable', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Buy milk', false, null),
      todo(2, 'Team standup', false, 'bob'),
    ]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');

    await user.click(document.getElementById('share-todos-button') as HTMLElement);

    const panel = document.getElementById('sharing-panel') as HTMLElement;
    expect(panel).toBeInTheDocument();

    const items = panel.querySelectorAll('.todo-item');
    const buyMilkItem = Array.from(items).find((el) => el.textContent?.includes('Buy milk'));
    expect(buyMilkItem).toBeDefined();
    expect(buyMilkItem!.classList.contains('selectable')).toBe(true);

    const standupItem = Array.from(items).find((el) => el.textContent?.includes('Team standup'));
    expect(standupItem).toBeDefined();
    expect(standupItem!.classList.contains('selectable')).toBe(false);

    // Clicking an own todo row selects it
    await user.click(buyMilkItem as HTMLElement);
    expect(buyMilkItem!.classList.contains('selected')).toBe(true);
  });

  it('submit button disabled until todo selected AND username entered', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false, null)]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');

    await user.click(document.getElementById('share-todos-button') as HTMLElement);

    const submitBtn = document.querySelector('.share-submit-button') as HTMLButtonElement;
    expect(submitBtn).toBeDisabled();

    // Click "Buy milk" row — still disabled, no username
    const panel = document.getElementById('sharing-panel') as HTMLElement;
    const buyMilkItem = Array.from(panel.querySelectorAll('.todo-item')).find(
      (el) => el.textContent?.includes('Buy milk')
    ) as HTMLElement;
    await user.click(buyMilkItem);
    expect(submitBtn).toBeDisabled();

    // Click again to deselect, then fill username — still disabled, no todo selected
    await user.click(buyMilkItem);
    const recipientInput = panel.querySelector('.sharing-recipient-input') as HTMLInputElement;
    await user.type(recipientInput, 'alice');
    expect(submitBtn).toBeDisabled();
  });

  it('successful share clears selection, clears input, shows success toast', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false, null)]);
    vi.mocked(api.shareTodos).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');

    await user.click(document.getElementById('share-todos-button') as HTMLElement);
    const panel = document.getElementById('sharing-panel') as HTMLElement;

    const buyMilkItem = Array.from(panel.querySelectorAll('.todo-item')).find(
      (el) => el.textContent?.includes('Buy milk')
    ) as HTMLElement;
    await user.click(buyMilkItem);

    const recipientInput = panel.querySelector('.sharing-recipient-input') as HTMLInputElement;
    await user.type(recipientInput, 'alice');

    const submitBtn = document.querySelector('.share-submit-button') as HTMLButtonElement;
    await user.click(submitBtn);

    expect(document.querySelector('.toast.success')).toBeInTheDocument();
    expect(panel.querySelector('.todo-item.selected')).not.toBeInTheDocument();
    expect(recipientInput.value).toBe('');
  });

  it('failed share shows error toast and preserves state', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false, null)]);
    vi.mocked(api.shareTodos).mockRejectedValue(new Error('user does not exist'));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');

    await user.click(document.getElementById('share-todos-button') as HTMLElement);
    const panel = document.getElementById('sharing-panel') as HTMLElement;

    const buyMilkItem = Array.from(panel.querySelectorAll('.todo-item')).find(
      (el) => el.textContent?.includes('Buy milk')
    ) as HTMLElement;
    await user.click(buyMilkItem);

    const recipientInput = panel.querySelector('.sharing-recipient-input') as HTMLInputElement;
    await user.type(recipientInput, 'unknownuser');

    const submitBtn = document.querySelector('.share-submit-button') as HTMLButtonElement;
    await user.click(submitBtn);

    const errorToast = document.querySelector('.toast.error') as HTMLElement;
    expect(errorToast).toBeInTheDocument();
    expect(errorToast.textContent).toContain('user does not exist');
    expect(panel.querySelector('.todo-item.selected')).toBeInTheDocument();
    expect(recipientInput.value).toBe('unknownuser');
  });

  it('shared-by label is preserved after editing a shared todo', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Team standup', false, 'bob')]);
    // editTodo returns a plain Todo without sharedBy, simulating the backend PATCH response
    vi.mocked(api.editTodo).mockResolvedValue({ id: 1, text: 'Weekly standup', done: false });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Team standup');

    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = document.querySelector('.edit-input') as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, 'Weekly standup');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await screen.findByText('Weekly standup');
    const label = document.querySelector('.shared-by-label') as HTMLElement;
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('Shared by bob');
  });

  it('TodoItem renders .shared-by-label when sharedBy is set', () => {
    const sharedTodo = todo(1, 'Team standup', false, 'bob');
    render(
      <TodoItem
        todo={sharedTodo}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditCancel={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    const label = document.querySelector('.shared-by-label') as HTMLElement;
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('Shared by bob');
  });
});
