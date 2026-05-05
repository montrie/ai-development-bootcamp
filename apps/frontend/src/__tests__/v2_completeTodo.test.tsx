import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../api';
import App from '../App';

vi.mock('../api');
vi.mock('../auth', () => ({ getToken: () => 'fake-token', setToken: vi.fn(), clearToken: vi.fn() }));

const todo = (id: number, text: string, done = false) => ({ id, text, done });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false)]);
  vi.mocked(api.updateTodo).mockResolvedValue(todo(1, 'Buy milk', true));
});

describe('Complete ToDo Item', () => {
  it('renders a checkbox for each todo item', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox when the todo is not done', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders a checked checkbox when the todo is done', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', true)]);
    render(<App />);
    await screen.findByText('Buy milk');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls updateTodo with done=true when an unchecked checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('checkbox'));
    expect(api.updateTodo).toHaveBeenCalledWith(1, true);
  });

  it('calls updateTodo with done=false when a checked checkbox is clicked', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', true)]);
    vi.mocked(api.updateTodo).mockResolvedValue(todo(1, 'Buy milk', false));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(screen.getByRole('checkbox'));
    expect(api.updateTodo).toHaveBeenCalledWith(1, false);
  });

  it('applies the completed class to the text when the todo is done', async () => {
    vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', true)]);
    render(<App />);
    const text = await screen.findByText('Buy milk');
    expect(text).toHaveClass('completed');
  });
});
