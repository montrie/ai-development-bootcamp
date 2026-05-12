import { useEffect, useState, useCallback } from 'react';
import {
  fetchAuditLogs,
  fetchAuditLogActionTypes,
  clearAuditLogs,
  type AuditLog,
  type AuditLogFilter,
} from '../services/api';
import '../styles/AuditLogsPage.css';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLogs = useCallback(() => {
    const filter: AuditLogFilter = {};
    if (actionTypeFilter) filter.actionType = actionTypeFilter;
    if (usernameFilter) filter.username = usernameFilter;
    if (startDate) filter.startDate = startDate + 'T00:00:00Z';
    if (endDate) filter.endDate = endDate + 'T23:59:59Z';
    fetchAuditLogs(filter).then(setLogs).catch(console.error);
  }, [actionTypeFilter, usernameFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogActionTypes().then(setActionTypes).catch(console.error);
    fetchAuditLogs({}).then(setLogs).catch(console.error);
  }, []);

  async function handleClear() {
    if (!window.confirm('Clear all audit log entries? This cannot be undone.')) return;
    await clearAuditLogs();
    setLogs([]);
  }

  return (
    <div className="audit-logs-page">
      <div className="audit-filter-bar">
        <select
          id="audit-action-type"
          value={actionTypeFilter}
          onChange={e => setActionTypeFilter(e.target.value)}
        >
          <option value="">All actions</option>
          {actionTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          id="audit-username"
          type="text"
          placeholder="Filter by username"
          value={usernameFilter}
          onChange={e => setUsernameFilter(e.target.value)}
        />
        <input
          id="audit-start-date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          id="audit-end-date"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <button id="apply-audit-filters-button" onClick={loadLogs}>
          Apply Filters
        </button>
        <button id="clear-audit-logs-button" onClick={handleClear}>
          Clear All Logs
        </button>
      </div>
      <table id="audit-log-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User</th>
            <th>Outcome</th>
            <th>Resource ID</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.timestamp}</td>
              <td>{log.actionType}</td>
              <td>{log.actorUsername}</td>
              <td>{log.outcome}</td>
              <td>{log.resourceId ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
