import { useEffect, useState } from 'react';
import { fetchUsers, deleteUser, resetUserPassword, type User } from '../services/api';
import Navbar from './Navbar';
import '../styles/AdminPanel.css';

interface Props {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [resetTargetName, setResetTargetName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  async function handleDelete(id: number) {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  function handleStartReset(user: User) {
    setResetTargetId(user.id);
    setResetTargetName(user.username);
    setNewPassword('');
  }

  async function handleResetPassword() {
    if (resetTargetId === null) return;
    await resetUserPassword(resetTargetId, newPassword);
    setResetTargetId(null);
    setResetTargetName('');
    setNewPassword('');
  }

  return (
    <div className="user-management-panel">
      <Navbar title="Admin Panel" onLogout={onLogout} />
      <div className="admin-content">
        <p className="admin-section-title">Registered users</p>
        <ul className="admin-user-list">
          {users.map(user => (
            <li key={user.id} className="user-item" data-username={user.username}>
              <span className="user-item-name">{user.username}</span>
              <div className="user-item-actions">
                <button
                  className="admin-btn-reset"
                  aria-label={`Reset password for ${user.username}`}
                  onClick={() => handleStartReset(user)}
                >
                  Reset password
                </button>
                <button
                  className="admin-btn-delete"
                  aria-label={`Delete user ${user.username}`}
                  onClick={() => handleDelete(user.id)}
                >
                  Delete user
                </button>
              </div>
            </li>
          ))}
        </ul>
        {resetTargetId !== null && (
          <div className="reset-password-card">
            <h3>Reset password for {resetTargetName}</h3>
            <input
              id="new-password-input"
              className="reset-password-input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <button id="confirm-reset-button" onClick={handleResetPassword}>
              Confirm reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
