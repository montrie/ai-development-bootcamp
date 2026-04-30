import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTodoForm from '../components/AddTodoForm';
import TodoList from '../components/TodoList';

const getInput = () => screen.getByRole('textbox');
const getAddButton = () => screen.getByRole('button', { name: /add/i });

describe('Edge Cases — AddTodoForm validation', () => {
  it('sets aria-invalid on the input when an empty submit is attempted', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm onAdd={vi.fn()} />);
    await user.click(getAddButton());
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-invalid on the input when a whitespace-only submit is attempted', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm onAdd={vi.fn()} />);
    await user.type(getInput(), '   ');
    await user.click(getAddButton());
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears aria-invalid once the user starts typing after a failed submit', async () => {
    const user = userEvent.setup();
    render(<AddTodoForm onAdd={vi.fn()} />);
    await user.click(getAddButton());
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
    await user.type(getInput(), 'a');
    expect(getInput()).not.toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Edge Cases — TodoList empty state', () => {
  it('renders the empty placeholder when the todo list is empty', () => {
    render(<TodoList todos={[]} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('No tasks yet — add one above!')).toBeInTheDocument();
  });
});
