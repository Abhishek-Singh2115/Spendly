import { useState } from 'react';
import { supabase } from '../supabase';

export const LoginPage = () => {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);

  const clear = () => setError('');

  const handleEmailAuth = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); clear();

    if (mode === 'signup') {
      const displayName = name.trim() || email.split('@')[0];
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: displayName } },
      });
      if (err) { setError(err.message); setLoading(false); return; }
      setSent(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      // App.jsx onAuthStateChange handles redirect
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); clear();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setLoading(false); }
  };

  const S = {
    page: { minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg)' },
    wrap: { width: '100%', maxWidth: 360 },
    logo: { textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' },
    sub: { textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginBottom: 28 },
    card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '22px 20px', marginBottom: 14 },
    tabRow: { display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg)', borderRadius: 12, padding: 4 },
    tab: (active) => ({ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all .2s', background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: active ? '#fff' : 'var(--muted)' }),
    label: { fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '11px 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    btn: { width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', opacity: loading ? 0.7 : 1, marginTop: 4 },
    divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: 'var(--muted)', fontSize: 12 },
    divLine: { flex: 1, height: 1, background: 'var(--border)' },
    gBtn: { width: '100%', padding: '12px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 },
    err: { color: 'var(--red)', fontSize: 13, textAlign: 'center', marginTop: 10, padding: '8px 12px', background: 'rgba(244,63,94,.1)', borderRadius: 8 },
  };

  if (sent) return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logo}>Spendly</div>
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Check your inbox</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Confirmation link sent to <strong>{email}</strong>.<br />Click it then come back to sign in.
          </div>
          <button style={{ ...S.btn, marginTop: 20 }} onClick={() => { setSent(false); setMode('login'); }}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logo}>Spendly</div>
        <div style={S.sub}>Smart expense tracking 💸</div>

        <div style={S.card}>
          <div style={S.tabRow}>
            {['login','signup'].map(m => (
              <button key={m} style={S.tab(mode===m)} onClick={() => { setMode(m); clear(); }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div>
              <label style={S.label}>Name</label>
              <input style={S.input} placeholder="Your name" value={name} onChange={e => { setName(e.target.value); clear(); }} />
            </div>
          )}

          <div>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e => { setEmail(e.target.value); clear(); }} />
          </div>

          <div>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="••••••••" value={password}
              onChange={e => { setPassword(e.target.value); clear(); }}
              onKeyDown={e => e.key === 'Enter' && handleEmailAuth()} />
          </div>

          {error && <div style={S.err}>{error}</div>}

          <button style={S.btn} onClick={handleEmailAuth} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          <div style={S.divider}><div style={S.divLine}/><span>or</span><div style={S.divLine}/></div>

          <button style={S.gBtn} onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.5 2.8 13.5l7.8 6C12.5 13 17.8 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>
              <path fill="#FBBC05" d="M10.6 28.5A14.6 14.6 0 019.5 24c0-1.6.3-3.1.8-4.5l-7.8-6A23.9 23.9 0 000 24c0 3.9.9 7.5 2.5 10.8l8.1-6.3z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-8.1 6.3C6.6 42.5 14.6 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted2)', marginTop: 6 }}>
          {mode === 'login' ? "No account? Switch to Sign Up above." : "Have an account? Switch to Sign In above."}
        </p>
      </div>
    </div>
  );
};
