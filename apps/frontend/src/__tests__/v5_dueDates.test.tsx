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
  vi.mocked(api.createTodo).mockResolvedValue(todo(99, 'stub', false, null));
});

describe('Due Dates — display', () => {
  it('shows due-date-label when todo has a future due date', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Buy milk', false, '2099-12-31'),
    ]);
    render(<App />);
    await screen.findByText('Buy milk');
    expect(document.querySelector('.due-date-label')).toBeInTheDocument();
  });

  it('shows overdue class for past due date on incomplete todo', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Pay taxes', false, '2000-01-01'),
    ]);
    render(<App />);
    await screen.findByText('Pay taxes');
    expect(document.querySelector('.due-date-label.overdue')).toBeInTheDocument();
  });

  it('does NOT show overdue class for past due date on completed todo', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Pay taxes', true, '2000-01-01'),
    ]);
    render(<App />);
    await screen.findByText('Pay taxes');
    expect(document.querySelector('.overdue')).not.toBeInTheDocument();
    expect(document.querySelector('.due-date-label')).toBeInTheDocument();
  });

  it('shows no due-date-label when todo has no due date', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Buy milk', false, null),
    ]);
    render(<App />);
    await screen.findByText('Buy milk');
    expect(document.querySelector('.due-date-label')).not.toBeInTheDocument();
  });

  it('formats due date in current year without the year', async () => {
    const year = new Date().getFullYear();
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Call dentist', false, `${year}-12-15`),
    ]);
    render(<App />);
    await screen.findByText('Call dentist');
    const label = document.querySelector('.due-date-label');
    expect(label).toBeInTheDocument();
    expect(label!.textContent).toContain('15 Dec');
    expect(label!.textContent).not.toContain(String(year));
  });

  it('formats due date in a different year with the year', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([
      todo(1, 'Submit report', false, '2027-06-15'),
    ]);
    render(<App />);
    await screen.findByText('Submit report');
    const label = document.querySelector('.due-date-label');
    expect(label).toBeInTheDocument();
    expect(label!.textContent).toBe('Due 15 Jun 2027');
  });

  it('createTodo is called with dueDate when a date is selected', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([]);
    vi.mocked(api.createTodo).mockResolvedValue(todo(1, 'File taxes', false, '2027-04-30'));
    const user = userEvent.setup();
    render(<App />);

    const textInput = document.getElementById('todo-input') as HTMLInputElement;
    const datePicker = document.getElementById('due-date-input') as HTMLInputElement;

    await user.type(textInput, 'File taxes');
    await user.clear(datePicker);
    await user.type(datePicker, '2027-04-30');
    await user.click(document.getElementById('add-button')!);

    expect(api.createTodo).toHaveBeenCalledWith('File taxes', '2027-04-30');
  });
});
