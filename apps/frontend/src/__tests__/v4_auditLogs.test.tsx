import { render, waitFor } from '@testing-library/react';
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

const MOCK_LOGS: api.AuditLog[] = [
  {
    id: 1,
    timestamp: '2026-05-11T10:00:00Z',
    actionType: 'USER_LOGIN',
    actorUsername: 'alice',
    outcome: 'SUCCESS',
    resourceId: null,
  },
];

const MOCK_ACTION_TYPES = ['USER_LOGIN', 'USER_REGISTERED', 'TODO_CREATED'];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetToken.mockReturnValue('admin.jwt.token');
  mockGetRole.mockReturnValue('ADMIN');
  vi.mocked(api.fetchUsers).mockResolvedValue([]);
  vi.mocked(api.fetchAuditLogs).mockResolvedValue(MOCK_LOGS);
  vi.mocked(api.fetchAuditLogActionTypes).mockResolvedValue(MOCK_ACTION_TYPES);
  vi.mocked(api.clearAuditLogs).mockResolvedValue(undefined);
});

async function navigateToAuditLogs() {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => {
    expect(document.getElementById('admin-nav-audit-logs')).toBeInTheDocument();
  });
  await user.click(document.getElementById('admin-nav-audit-logs')!);
  await waitFor(() => {
    expect(document.getElementById('audit-log-table')).toBeInTheDocument();
  });
  return user;
}

describe('Audit Logs page — F-38', () => {
  it('renders audit log table when Audit Logs nav button is clicked', async () => {
    await navigateToAuditLogs();
    expect(document.getElementById('audit-log-table')).toBeInTheDocument();
  });

  it('displays log rows from fetchAuditLogs', async () => {
    await navigateToAuditLogs();
    await waitFor(() => {
      const rows = document.querySelectorAll('#audit-log-table tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });
    const cells = document.querySelectorAll('#audit-log-table tbody td');
    const cellTexts = Array.from(cells).map(c => c.textContent);
    expect(cellTexts).toContain('USER_LOGIN');
    expect(cellTexts).toContain('alice');
    expect(cellTexts).toContain('SUCCESS');
  });

  it('populates action type select from fetchAuditLogActionTypes', async () => {
    await navigateToAuditLogs();
    await waitFor(() => {
      const select = document.getElementById('audit-action-type') as HTMLSelectElement;
      const options = Array.from(select.options).map(o => o.value);
      expect(options).toContain('USER_LOGIN');
      expect(options).toContain('USER_REGISTERED');
    });
  });
});

describe('Audit Logs page — F-39 filters', () => {
  it('selecting action type and clicking Apply calls fetchAuditLogs with actionType filter', async () => {
    const user = await navigateToAuditLogs();
    vi.mocked(api.fetchAuditLogs).mockClear();
    const select = document.getElementById('audit-action-type') as HTMLSelectElement;
    await user.selectOptions(select, 'USER_LOGIN');
    await user.click(document.getElementById('apply-audit-filters-button')!);
    await waitFor(() => {
      expect(api.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'USER_LOGIN' })
      );
    });
  });

  it('typing username and clicking Apply calls fetchAuditLogs with username filter', async () => {
    const user = await navigateToAuditLogs();
    vi.mocked(api.fetchAuditLogs).mockClear();
    const input = document.getElementById('audit-username') as HTMLInputElement;
    await user.type(input, 'alice');
    await user.click(document.getElementById('apply-audit-filters-button')!);
    await waitFor(() => {
      expect(api.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice' })
      );
    });
  });

  it('entering start/end date and clicking Apply calls fetchAuditLogs with date params', async () => {
    const user = await navigateToAuditLogs();
    vi.mocked(api.fetchAuditLogs).mockClear();
    const startInput = document.getElementById('audit-start-date') as HTMLInputElement;
    const endInput = document.getElementById('audit-end-date') as HTMLInputElement;
    await user.type(startInput, '2026-05-01');
    await user.type(endInput, '2026-05-31');
    await user.click(document.getElementById('apply-audit-filters-button')!);
    await waitFor(() => {
      expect(api.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-05-01T00:00:00Z',
          endDate: '2026-05-31T23:59:59Z',
        })
      );
    });
  });
});

describe('Audit Logs page — F-40 clear', () => {
  it('clicking Clear All Logs calls clearAuditLogs and empties the table', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = await navigateToAuditLogs();
    const clearBtn = document.getElementById('clear-audit-logs-button')!;
    await user.click(clearBtn);
    await waitFor(() => {
      expect(api.clearAuditLogs).toHaveBeenCalled();
    });
    const tbody = document.querySelector('#audit-log-table tbody');
    expect(tbody?.children.length).toBe(0);
  });
});
