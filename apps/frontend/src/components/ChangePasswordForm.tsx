import { useState } from 'react';
import { changePassword } from '../services/api';
import '../styles/ChangePasswordForm.css';

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
    <div className="change-password-card">
      <h2>Change password</h2>
      <div className="change-password-field">
        <label htmlFor="current-password-input">Current password</label>
        <input
          id="current-password-input"
          className="change-password-input"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
      </div>
      <div className="change-password-field">
        <label htmlFor="new-password-input">New password</label>
        <input
          id="new-password-input"
          className="change-password-input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>
      <div className="change-password-field">
        <label htmlFor="confirm-password-input">Confirm new password</label>
        <input
          id="confirm-password-input"
          className="change-password-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
      </div>
      <button id="change-password-button" onClick={handleSubmit}>
        Change password
      </button>
      {status && <p className="password-change-status">{status}</p>}
    </div>
  );
}
