import { useState } from 'react';
import { storage } from '../utils/storage';

export const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const users = storage.get('sp_users', {});

  const handleSubmit = () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    if (mode === 'signup') {
      if (users[email]) {
        setError('Email already registered');
        return;
      }
      if (password.length < 4) {
        setError('Password too short');
        return;
      }
      users[email] = { pass: password, name: name || email.split('@')[0] };
      storage.set('sp_users', users);
      onLogin({ email, name: users[email].name });
    } else {
      if (!users[email] || users[email].pass !== password) {
        setError('Invalid credentials');
        return;
      }
      onLogin({ email, name: users[email].name });
    }
  };

  return (
    <div className="login-page" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 360, width: '100%' }}>
        <div className="login-logo" style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Spendly
        </div>
        <div className="login-sub" style={{ textAlign: 'center' }}>Smart expense tracking</div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                className={`btn btn-full ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setMode(m); setError(''); }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div className="input-group">
              <label>Name</label>
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-full" style={{ marginTop: 18 }} onClick={handleSubmit}>
            {mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
          Demo: sign up with any email/password (min 4 chars)
        </p>
      </div>
    </div>
  );
};