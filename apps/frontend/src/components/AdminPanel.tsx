import { useEffect, useState } from 'react';
import { fetchUsers, deleteUser, resetUserPassword, type User } from '../services/api';

interface Props {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  async function handleDelete(id: number) {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function handleResetPassword() {
    if (resetTargetId === null) return;
    await resetUserPassword(resetTargetId, newPassword);
    setResetTargetId(null);
    setNewPassword('');
  }

  return (
    <div className="user-management-panel">
      <div className="app-header">
        <h1>Admin Panel</h1>
        <button onClick={onLogout}>Log out</button>
      </div>
      <ul>
        {users.map(user => (
          <li key={user.id} className="user-item" data-username={user.username}>
            <span>{user.username}</span>
            <button onClick={() => handleDelete(user.id)}>
              Delete user {user.username}
            </button>
            <button onClick={() => { setResetTargetId(user.id); setNewPassword(''); }}>
              Reset password for {user.username}
            </button>
          </li>
        ))}
      </ul>
      {resetTargetId !== null && (
        <div>
          <input
            id="new-password-input"
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
  );
}
