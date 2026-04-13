import React, { useState } from 'react';
import { supabase } from '../../supabase';

export const PasswordForm = ({ user, onClose, showToast }) => {
  const [mode, setMode] = useState('change');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card2)',
    color: 'var(--text)',
    marginBottom: 12,
    outline: 'none'
  };

  const handleChange = async () => {
    if (password.length < 6) {
      setError('Minimum 6 characters required');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    showToast('Password updated ✓');
    onClose();
  };

  const handleForgot = async () => {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(user.email);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    showToast('Reset link sent ✓');
  };

  return (
    <div style={{ padding: 16 }}>

      {/* Title */}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Change Password
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className="btn"
          onClick={() => setMode('change')}
          style={{
            flex: 1,
            background: mode === 'change' ? 'var(--accent)' : 'var(--card2)',
            color: mode === 'change' ? '#fff' : 'var(--muted)'
          }}
        >
          Change
        </button>

        <button
          className="btn"
          onClick={() => setMode('forgot')}
          style={{
            flex: 1,
            background: mode === 'forgot' ? 'var(--accent)' : 'var(--card2)',
            color: mode === 'forgot' ? '#fff' : 'var(--muted)'
          }}
        >
          Forgot
        </button>
      </div>

      {/* CHANGE MODE */}
      {mode === 'change' && (
        <>
          <input
            type="password"
            placeholder="New password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm password"
            style={inputStyle}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={handleChange}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </>
      )}

      {/* FORGOT MODE */}
      {mode === 'forgot' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Reset link will be sent to:
            <br />
            <strong>{user?.email}</strong>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleForgot}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </>
      )}

      {/* ERROR */}
      {error && (
        <div style={{ color: 'red', marginTop: 10, fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  );
};