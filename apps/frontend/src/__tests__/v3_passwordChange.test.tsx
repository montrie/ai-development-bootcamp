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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.fetchTodos).mockResolvedValue([]);
  mockGetToken.mockReturnValue('test.jwt.token');
  mockGetRole.mockReturnValue('USER');
});

async function openChangePasswordForm() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(document.getElementById('change-password-link') as HTMLElement);
  return user;
}

describe('Password change form', () => {
  it('renders form when change-password-link is clicked', async () => {
    await openChangePasswordForm();
    expect(document.getElementById('change-password-button')).toBeInTheDocument();
    expect(document.getElementById('current-password-input')).toBeInTheDocument();
    expect(document.getElementById('new-password-input')).toBeInTheDocument();
    expect(document.getElementById('confirm-password-input')).toBeInTheDocument();
  });

  it('shows success status after a successful password change', async () => {
    vi.mocked(api.changePassword).mockResolvedValue(undefined);
    const user = await openChangePasswordForm();

    await user.type(document.getElementById('current-password-input') as HTMLElement, 'secret123');
    await user.type(document.getElementById('new-password-input') as HTMLElement, 'newpass456');
    await user.type(document.getElementById('confirm-password-input') as HTMLElement, 'newpass456');
    await user.click(document.getElementById('change-password-button') as HTMLElement);

    await waitFor(() =>
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    );
    expect(api.changePassword).toHaveBeenCalledWith('secret123', 'newpass456');
  });

  it('shows error status when current password is wrong', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(new Error('Current password is incorrect'));
    const user = await openChangePasswordForm();

    await user.type(document.getElementById('current-password-input') as HTMLElement, 'wrongpass');
    await user.type(document.getElementById('new-password-input') as HTMLElement, 'newpass456');
    await user.type(document.getElementById('confirm-password-input') as HTMLElement, 'newpass456');
    await user.click(document.getElementById('change-password-button') as HTMLElement);

    await waitFor(() =>
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    );
  });

  it('shows match error without calling API when new passwords do not match', async () => {
    const user = await openChangePasswordForm();

    await user.type(document.getElementById('current-password-input') as HTMLElement, 'secret123');
    await user.type(document.getElementById('new-password-input') as HTMLElement, 'newpass456');
    await user.type(document.getElementById('confirm-password-input') as HTMLElement, 'different789');
    await user.click(document.getElementById('change-password-button') as HTMLElement);

    expect(screen.getByText(/match/i)).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });
});
