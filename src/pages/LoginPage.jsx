import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/* ── keyframes injected once ── */
const styleId = 'login-page-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const sheet = document.createElement('style');
  sheet.id = styleId;
  sheet.textContent = `
    @keyframes lp-float1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-40px) scale(1.1)}}
    @keyframes lp-float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-25px,35px) scale(1.15)}}
    @keyframes lp-float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,25px) scale(1.05)}}
    @keyframes lp-fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lp-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes lp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.4)}50%{box-shadow:0 0 0 10px rgba(99,102,241,0)}}
    @keyframes lp-spin{to{transform:rotate(360deg)}}
    @keyframes lp-mailBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    .lp-input:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(99,102,241,.18)!important}
    .lp-btn-main:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.45)}
    .lp-btn-main:active:not(:disabled){transform:translateY(0) scale(.98)}
    .lp-btn-google:hover:not(:disabled){border-color:var(--accent);background:rgba(99,102,241,.06)}
    .lp-forgot:hover{color:var(--accent2)!important;text-decoration:underline!important}
    .lp-tab:hover{background:rgba(99,102,241,.08)}
    @media(min-width:768px){
      .lp-wrap{max-width:420px!important}
      .lp-card{padding:32px 28px!important}
    }
    @media(min-width:1200px){
      .lp-wrap{max-width:440px!important}
    }
  `;
  document.head.appendChild(sheet);
}

export const LoginPage = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

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

  /* ── shared styles ── */
  const page = {
    minHeight: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px', background: 'var(--bg)',
    position: 'relative', overflow: 'hidden',
  };
  const orb = (size, top, left, color, anim, dur) => ({
    position: 'absolute', width: size, height: size, borderRadius: '50%',
    background: color, filter: 'blur(80px)', opacity: 0.5, pointerEvents: 'none',
    top, left, animation: `${anim} ${dur}s ease-in-out infinite`,
  });
  const wrap = { width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 };
  const card = {
    background: 'var(--card)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--border)', borderRadius: 22,
    padding: '24px 20px', marginBottom: 14,
    animation: mounted ? 'lp-fadeUp .5s cubic-bezier(.4,0,.2,1) .15s both' : 'none',
  };
  const logo = {
    textAlign: 'center', marginBottom: 4, fontFamily: 'var(--font-head)',
    fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px',
    background: 'linear-gradient(135deg,#818cf8,#a78bfa,#c084fc)',
    backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    animation: 'lp-shimmer 4s linear infinite',
    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: 'all .5s cubic-bezier(.4,0,.2,1)',
  };
  const sub = {
    textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginBottom: 28,
    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: 'all .5s cubic-bezier(.4,0,.2,1) .1s',
  };
  const tabRow = {
    display: 'flex', gap: 4, marginBottom: 20, background: 'var(--card2)',
    borderRadius: 14, padding: 4,
  };
  const tab = (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, letterSpacing: '.02em',
    transition: 'all .25s cubic-bezier(.4,0,.2,1)',
    background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    boxShadow: active ? '0 4px 16px rgba(99,102,241,.3)' : 'none',
    fontFamily: 'var(--font-body)',
  });
  const label = {
    fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginBottom: 6,
    display: 'block', textTransform: 'uppercase', letterSpacing: '.06em',
  };
  const input = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid var(--border)', background: 'var(--card2)',
    color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
    marginBottom: 14, transition: 'all .22s cubic-bezier(.4,0,.2,1)',
    fontFamily: 'var(--font-body)',
  };
  const btnMain = {
    width: '100%', padding: '13px 0', borderRadius: 13, border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
    opacity: loading ? 0.7 : 1, marginTop: 6, transition: 'all .22s ease',
    fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden',
  };
  const divider = {
    display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0',
    color: 'var(--muted)', fontSize: 12,
  };
  const divLine = { flex: 1, height: 1, background: 'var(--border)' };
  const gBtn = {
    width: '100%', padding: '12px 0', borderRadius: 13,
    border: '1.5px solid var(--border)', background: 'var(--card2)',
    color: 'var(--text)', fontSize: 15, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    opacity: loading ? 0.7 : 1, transition: 'all .22s ease',
    fontFamily: 'var(--font-body)',
  };
  const errBox = {
    color: '#fb7185', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 4,
    padding: '10px 14px', background: 'rgba(244,63,94,.1)',
    border: '1px solid rgba(244,63,94,.2)', borderRadius: 10,
    animation: 'lp-fadeUp .25s ease both',
  };
  const pwdToggle = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
    padding: 4, display: 'flex', fontSize: 16,
  };
  const spinner = {
    display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)',
    borderTopColor: '#fff', borderRadius: '50%', animation: 'lp-spin .6s linear infinite',
    marginRight: 8, verticalAlign: 'middle',
  };

  /* ── Sent confirmation ── */
  if (sent) return (
    <div style={page}>
      <div style={orb('260px', '-80px', '-60px', 'rgba(99,102,241,.35)', 'lp-float1', 7)} />
      <div style={orb('200px', '60%', '70%', 'rgba(139,92,246,.3)', 'lp-float2', 9)} />
      <div style={wrap} className="lp-wrap">
        <div style={logo}>Spendly</div>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14, animation: 'lp-mailBounce 2s ease-in-out infinite' }}>📬</div>
          <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 8, color: 'var(--text)' }}>Check your inbox</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            Confirmation link sent to <strong style={{ color: '#a78bfa' }}>{email}</strong>.<br />Click it then come back to sign in.
          </div>
          <button className="lp-btn-main" style={{ ...btnMain, marginTop: 22 }} onClick={() => { setSent(false); setMode('login'); }}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Main login/signup ── */
  return (
    <div style={page}>
      {/* Animated gradient orbs */}
      <div style={orb('280px', '-100px', '-80px', 'rgba(99,102,241,.3)', 'lp-float1', 7)} />
      <div style={orb('220px', '55%', '65%', 'rgba(139,92,246,.25)', 'lp-float2', 9)} />
      <div style={orb('180px', '30%', '-40px', 'rgba(6,182,212,.2)', 'lp-float3', 11)} />

      <div style={wrap} className="lp-wrap">
        <div style={logo}>Spendly</div>
        <div style={sub}>Smart expense tracking ✨</div>

        <div style={card} className="lp-card">
          {/* Tabs */}
          <div style={tabRow}>
            {['login', 'signup'].map(m => (
              <button key={m} className="lp-tab" style={tab(mode === m)} onClick={() => { setMode(m); clear(); }}>
                {m === 'login' ? '🔑 Sign In' : '🚀 Sign Up'}
              </button>
            ))}
          </div>

          {/* Name field (signup only) */}
          {mode === 'signup' && (
            <div style={{ animation: 'lp-fadeUp .3s ease both' }}>
              <label style={label}>Name</label>
              <input className="lp-input" style={input} placeholder="Your name" value={name}
                onChange={e => { setName(e.target.value); clear(); }} />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={label}>Email</label>
            <input className="lp-input" style={input} type="email" placeholder="you@email.com"
              value={email} onChange={e => { setEmail(e.target.value); clear(); }} />
          </div>

          {/* Password with toggle */}
          <div>
            <label style={label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="lp-input" style={{ ...input, paddingRight: 42, marginBottom: 6 }}
                type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); clear(); }}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()} />
              <button style={pwdToggle} onClick={() => setShowPwd(p => !p)} type="button" tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div style={errBox}>{error}</div>}

          {/* Forgot password */}
          <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 4 }}>
            <button type="button" className="lp-forgot" style={{
              background: 'none', border: 'none', color: '#818cf8',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
            }} onClick={() => {
              console.log("CLICK WORKING");
              window.dispatchEvent(new Event("open-forgot-password"));
            }}>
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button className="lp-btn-main" style={btnMain} onClick={handleEmailAuth} disabled={loading}>
            {loading && <span style={spinner} />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          {/* Divider */}
          <div style={divider}><div style={divLine} /><span>or</span><div style={divLine} /></div>

          {/* Google */}
          <button className="lp-btn-google" style={gBtn} onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.5 2.8 13.5l7.8 6C12.5 13 17.8 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z" />
              <path fill="#FBBC05" d="M10.6 28.5A14.6 14.6 0 019.5 24c0-1.6.3-3.1.8-4.5l-7.8-6A23.9 23.9 0 000 24c0 3.9.9 7.5 2.5 10.8l8.1-6.3z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-8.1 6.3C6.6 42.5 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--muted2)', marginTop: 8,
          opacity: mounted ? 1 : 0, transition: 'opacity .5s ease .4s',
        }}>
          {mode === 'login' ? "No account? Switch to Sign Up above." : "Have an account? Switch to Sign In above."}
        </p>
      </div>
    </div>
  );
};
