import { useState } from 'react';
import { changePassword } from '../services/api';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit() {
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setStatus('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setStatus('Current password is incorrect');
    }
  }

  return (
    <div>
      <input
        id="current-password-input"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current password"
      />
      <input
        id="new-password-input"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password"
      />
      <input
        id="confirm-password-input"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
      />
      <button id="change-password-button" onClick={handleSubmit}>
        Change password
      </button>
      {status && <p className="password-change-status">{status}</p>}
    </div>
  );
}
