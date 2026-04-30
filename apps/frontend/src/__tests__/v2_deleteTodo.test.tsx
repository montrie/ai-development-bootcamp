import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../api';
import App from '../App';

vi.mock('../api');

const todo = (id: number, text: string, done = false) => ({ id, text, done });
const getDeleteButton = (text: string) =>
  screen.getByRole('button', { name: new RegExp(`delete ${text}`, 'i') });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([todo(1, 'Buy milk', false)]);
  vi.mocked(api.deleteTodo).mockResolvedValue(undefined);
});

describe('Delete ToDo Item', () => {
  it('renders a delete button for each todo item', async () => {
    render(<App />);
    await screen.findByText('Buy milk');
    expect(getDeleteButton('Buy milk')).toBeInTheDocument();
  });

  it('calls deleteTodo with the correct id when the delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(getDeleteButton('Buy milk'));
    expect(api.deleteTodo).toHaveBeenCalledWith(1);
  });

  it('removes the item and shows the placeholder after deleting the last todo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Buy milk');
    await user.click(getDeleteButton('Buy milk'));
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
      expect(screen.getByText('No tasks yet — add one above!')).toBeInTheDocument();
    });
  });
});
