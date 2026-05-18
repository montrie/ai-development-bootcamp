import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../services/api';
import * as auth from '../services/auth';
import App from '../App';

vi.mock('../services/api');
vi.mock('../services/auth', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getRole: vi.fn(),
}));

const mockGetToken = vi.mocked(auth.getToken);
const mockGetRole = vi.mocked(auth.getRole);

const MOCK_USERS: api.User[] = [{ id: 1, username: 'alice', role: 'USER' }];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetToken.mockReturnValue('admin.jwt.token');
  mockGetRole.mockReturnValue('ADMIN');
  vi.mocked(api.fetchUsers).mockResolvedValue(MOCK_USERS);
});

describe('Admin panel — F-25 list users', () => {
  it('shows user management panel for admin role', async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector('.user-management-panel')).toBeInTheDocument();
    });
  });

  it('does not show todo input for admin', async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector('.user-management-panel')).toBeInTheDocument();
    });
    expect(document.querySelector('#todo-input')).not.toBeInTheDocument();
  });

  it('renders each user as a user-item', async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.querySelector('.user-item[data-username="alice"]')).toBeInTheDocument();
    });
  });
});

describe('Admin panel — F-26 delete user', () => {
  it('removes user from list after delete', async () => {
    vi.mocked(api.deleteUser).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: /delete user alice/i });
    await user.click(screen.getByRole('button', { name: /delete user alice/i }));
    await waitFor(() => {
      expect(document.querySelector('.user-item[data-username="alice"]')).not.toBeInTheDocument();
    });
  });
});

async function openResetPasswordForm(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await screen.findByRole('button', { name: /reset password for alice/i });
  await user.click(screen.getByRole('button', { name: /reset password for alice/i }));
}

describe('Admin panel — F-27 reset password', () => {
  it('confirm reset button is disabled when password input is empty', async () => {
    const user = userEvent.setup();
    await openResetPasswordForm(user);
    expect(document.getElementById('confirm-reset-button')).toBeDisabled();
  });

  it('confirm reset button is disabled when password is whitespace only', async () => {
    const user = userEvent.setup();
    await openResetPasswordForm(user);
    await user.type(document.getElementById('new-password-input')!, '   ');
    expect(document.getElementById('confirm-reset-button')).toBeDisabled();
  });

  it('confirm reset button is enabled when password input has a value', async () => {
    const user = userEvent.setup();
    await openResetPasswordForm(user);
    await user.type(document.getElementById('new-password-input')!, 'newpass');
    expect(document.getElementById('confirm-reset-button')).toBeEnabled();
  });

  it('calls resetUserPassword with new password', async () => {
    vi.mocked(api.resetUserPassword).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await openResetPasswordForm(user);
    await user.type(document.getElementById('new-password-input')!, 'newpass123');
    await user.click(document.getElementById('confirm-reset-button')!);
    await waitFor(() => {
      expect(api.resetUserPassword).toHaveBeenCalledWith(1, 'newpass123');
    });
  });
});
