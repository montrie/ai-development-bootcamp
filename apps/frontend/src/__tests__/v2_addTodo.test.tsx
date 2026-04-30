import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../api';
import App from '../App';

vi.mock('../api');

const todo = (id: number, text: string, done = false) => ({ id, text, done });
const getInput = () => screen.getByRole('textbox');
const getAddButton = () => screen.getByRole('button', { name: /add/i });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([]);
  vi.mocked(api.createTodo).mockImplementation((text) =>
    Promise.resolve(todo(1, text))
  );
});

describe('Add ToDo Item', () => {
  it('renders a text input and an Add button', () => {
    render(<App />);
    expect(getInput()).toBeInTheDocument();
    expect(getAddButton()).toBeInTheDocument();
  });

  it('calls createTodo with trimmed text when Add is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(getInput(), 'Buy milk');
    await user.click(getAddButton());
    expect(api.createTodo).toHaveBeenCalledWith('Buy milk');
  });

  it('calls createTodo when Enter is pressed in the input', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(getInput(), 'Buy milk');
    await user.keyboard('{Enter}');
    expect(api.createTodo).toHaveBeenCalledWith('Buy milk');
  });

  it('new todo items are appended to the bottom of the list', async () => {
    vi.mocked(api.createTodo)
      .mockResolvedValueOnce(todo(1, 'Buy milk'))
      .mockResolvedValueOnce(todo(2, 'Call dentist'));
    const user = userEvent.setup();
    render(<App />);

    await user.type(getInput(), 'Buy milk');
    await user.click(getAddButton());
    await screen.findByText('Buy milk');

    await user.type(getInput(), 'Call dentist');
    await user.click(getAddButton());
    await screen.findByText('Call dentist');

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Buy milk');
    expect(items[1]).toHaveTextContent('Call dentist');
  });

  it('clears the input after adding a todo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(getInput(), 'Buy milk');
    await user.click(getAddButton());
    expect(getInput()).toHaveValue('');
  });

  it('does not call createTodo when input is empty', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(getAddButton());
    expect(api.createTodo).not.toHaveBeenCalled();
  });

  it('does not call createTodo when input contains only whitespace', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(getInput(), '   ');
    await user.click(getAddButton());
    expect(api.createTodo).not.toHaveBeenCalled();
  });

  it('sets aria-invalid on the input when an empty submit is attempted', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(getAddButton());
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });
});
