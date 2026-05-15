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

// Playwright's dragTo() uses native HTML5 drag events; we simulate the same sequence here.
function simulateDrag(dragSource: HTMLElement, dropTarget: HTMLElement) {
  dragSource.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
  dropTarget.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
  dropTarget.dispatchEvent(new DragEvent('drop', { bubbles: true }));
  dragSource.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([
    todo(1, 'Alpha'),
    todo(2, 'Beta'),
    todo(3, 'Gamma'),
  ]);
  vi.mocked(api.fetchUserProfile).mockResolvedValue({ sortMode: 'CREATED_ASC' });
  vi.mocked(api.updateSortMode).mockResolvedValue(undefined);
  vi.mocked(api.reorderTodos).mockResolvedValue(undefined);
});

describe('Drag and Drop — F-66–F-69', () => {
  it('each todo item shows a drag handle in normal viewing mode', async () => {
    render(<App />);
    await screen.findByText('Alpha');
    const handles = document.querySelectorAll('[data-testid="drag-handle"]');
    expect(handles).toHaveLength(3);
  });

  it('drag handles are hidden when a todo item is in inline edit mode', async () => {
    vi.mocked(api.editTodo).mockResolvedValue(todo(2, 'Beta edited'));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alpha');

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[1]);

    const handles = document.querySelectorAll('[data-testid="drag-handle"]');
    expect(handles).toHaveLength(0);
  });

  it('todo items are not draggable when a todo is in inline edit mode', async () => {
    vi.mocked(api.editTodo).mockResolvedValue(todo(2, 'Beta edited'));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Alpha');

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[1]);

    const items = document.querySelectorAll('.todo-item');
    items.forEach((item) => {
      expect(item).not.toHaveAttribute('draggable', 'true');
    });
  });

  it('todo items have draggable attribute in normal viewing mode', async () => {
    render(<App />);
    await screen.findByText('Alpha');
    const items = document.querySelectorAll('.todo-item');
    items.forEach((item) => {
      expect(item).toHaveAttribute('draggable', 'true');
    });
  });

  it('reorderTodos is called after a drag-and-drop reorder', async () => {
    render(<App />);
    await screen.findByText('Alpha');

    const items = document.querySelectorAll('.todo-item');
    // Drag Gamma (index 2) onto Alpha (index 0) to move it to the front
    simulateDrag(items[2] as HTMLElement, items[0] as HTMLElement);

    await waitFor(() => expect(api.reorderTodos).toHaveBeenCalled());
    const call = vi.mocked(api.reorderTodos).mock.calls[0][0];
    expect(call).toEqual([3, 1, 2]);
  });

  it('on reorderTodos failure the todo list reverts to original order', async () => {
    vi.mocked(api.reorderTodos).mockRejectedValue(new Error('Server error'));
    render(<App />);
    await screen.findByText('Alpha');

    const items = document.querySelectorAll('.todo-item');
    // Drag Gamma (index 2) onto Alpha (index 0)
    simulateDrag(items[2] as HTMLElement, items[0] as HTMLElement);

    await waitFor(() => {
      const listItems = document.querySelectorAll('.todo-item');
      expect(listItems[0]).toHaveTextContent('Alpha');
      expect(listItems[1]).toHaveTextContent('Beta');
      expect(listItems[2]).toHaveTextContent('Gamma');
    });
  });

  it('on reorderTodos failure an error message is shown', async () => {
    vi.mocked(api.reorderTodos).mockRejectedValue(new Error('Server error'));
    render(<App />);
    await screen.findByText('Alpha');

    const items = document.querySelectorAll('.todo-item');
    // Drag Gamma (index 2) onto Alpha (index 0)
    simulateDrag(items[2] as HTMLElement, items[0] as HTMLElement);

    await waitFor(() => {
      expect(document.querySelector('.error-message')).toBeInTheDocument();
    });
  });

  it('after a successful drag the sort mode selector shows CUSTOM', async () => {
    render(<App />);
    await screen.findByText('Alpha');

    const items = document.querySelectorAll('.todo-item');
    // Drag Beta (index 1) onto Gamma (index 2)
    simulateDrag(items[1] as HTMLElement, items[2] as HTMLElement);

    await waitFor(() => {
      const select = document.querySelector('[data-testid="sort-mode-select"]') as HTMLSelectElement;
      expect(select.value).toBe('CUSTOM');
    });
  });
});
