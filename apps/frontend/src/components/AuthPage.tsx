import { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import '../styles/AuthPage.css';

type Tab = 'login' | 'register';

interface Props {
  onAuth: (token: string) => void;
}

export default function AuthPage({ onAuth }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      const token =
        tab === 'login'
          ? await loginUser(username, password)
          : await registerUser(username, password);
      onAuth(token);
    } catch {
      setError(tab === 'login' ? 'Invalid username or password.' : 'Registration failed.');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">To-Do List</h1>

        <div role="tablist" className="auth-tab-list">
          <button
            role="tab"
            className="auth-tab"
            aria-selected={tab === 'login'}
            onClick={() => { setTab('login'); setError(null); }}
          >
            Log in
          </button>
          <button
            role="tab"
            className="auth-tab"
            aria-selected={tab === 'register'}
            onClick={() => { setTab('register'); setError(null); }}
          >
            Register
          </button>
        </div>

        <div className="auth-field">
          <label htmlFor="username-input">Username</label>
          <input
            id="username-input"
            type="text"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password-input">Password</label>
          <input
            id="password-input"
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" onClick={handleSubmit}>
          {tab === 'login' ? 'Log in' : 'Register'}
        </button>
      </div>
    </div>
  );
}
