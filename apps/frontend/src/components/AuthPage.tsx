import { useState } from 'react';
import { loginUser, registerUser } from '../api';

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

  return (
    <div className="auth-page">
      <h1>To-Do List</h1>
      <div role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'login'}
          onClick={() => { setTab('login'); setError(null); }}
        >
          Log in
        </button>
        <button
          role="tab"
          aria-selected={tab === 'register'}
          onClick={() => { setTab('register'); setError(null); }}
        >
          Register
        </button>
      </div>

      <div>
        <label htmlFor="username-input">Username</label>
        <input
          id="username-input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password-input">Password</label>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      {tab === 'login' ? (
        <button onClick={handleSubmit}>Log in</button>
      ) : (
        <button onClick={handleSubmit}>Register</button>
      )}
    </div>
  );
}
