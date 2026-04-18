import { useState } from 'react';
import { CURRENCIES } from '../utils/constants';
import { FeedbackModal } from '../components/settings/FeedbackModal';
import { supabase } from '../supabase';

export const SettingsPage = ({ ctx, onLogout }) => {
  const { user, settings, updateSettings, showToast } = ctx;
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) { showToast('Name cannot be empty'); return; }
    if (trimmed === user.name) { setEditingName(false); return; }
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });
    setSavingName(false);
    if (error) { showToast('Failed to update name'); return; }
    user.name = trimmed;
    setEditingName(false);
    showToast('Name updated!');
  };

  const themes = [
    { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on the eyes', color: '#6366f1' },
    { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Bright and clean', color: '#f59e0b' },
    { id: 'system', label: 'System', icon: '💻', desc: 'Follows device', color: '#06b6d4' },
  ];

  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];
  const currentCurrency = CURRENCIES.find(c => c.code === settings.currency);

  const SectionLabel = ({ children }) => (
    <div style={{
      fontSize: 11, color: 'var(--muted2)', fontWeight: 700,
      letterSpacing: '.08em', marginBottom: 8, marginTop: 20,
      textTransform: 'uppercase', paddingLeft: 2
    }}>
      {children}
    </div>
  );

  const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
  );

  return (
    <div>
      <div className="page-top">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Settings
        </div>

        {/* Profile Card — Premium */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a3e 0%, #1e1040 60%, #0f172a 100%)',
          border: '1px solid rgba(99,102,241,.2)',
          borderRadius: 'var(--radius)', padding: '20px',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative */}
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -20, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(99,102,241,.06)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 700,
              boxShadow: '0 4px 16px rgba(99,102,241,.3)',
              flexShrink: 0
            }}>
              {(nameValue || user?.name)?.[0]?.toUpperCase() || 'U'}
            </div>

            <div style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    style={{
                      background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                      borderRadius: 8, padding: '6px 10px', color: '#fff',
                      fontSize: 15, fontWeight: 600, flex: 1, outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    style={{
                      background: 'var(--green)', border: 'none', borderRadius: 8,
                      padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', opacity: savingName ? 0.6 : 1
                    }}
                  >{savingName ? '...' : '✓'}</button>
                  <button
                    onClick={() => { setNameValue(user.name); setEditingName(false); }}
                    style={{
                      background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8,
                      padding: '6px 10px', color: 'var(--red)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>{user.name}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    style={{
                      background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 6,
                      padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>EDIT</span>
                  </button>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Appearance */}
        <SectionLabel>Appearance</SectionLabel>

        <div
          onClick={() => setShowThemeSheet(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 14,
            cursor: 'pointer', transition: 'var(--transition)', marginBottom: 8
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${currentTheme.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>
            {currentTheme.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Theme</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentTheme.label}</div>
          </div>
          <ChevronRight />
        </div>

        {/* Currency */}
        <SectionLabel>Currency</SectionLabel>

        <div
          onClick={() => setShowCurrencySheet(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 14,
            cursor: 'pointer', transition: 'var(--transition)', marginBottom: 8
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(16,185,129,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'var(--green)',
            fontFamily: 'var(--font-head)'
          }}>
            {currentCurrency?.symbol || '₹'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Currency</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {currentCurrency?.name || 'Indian Rupee'} · {settings.currency}
            </div>
          </div>
          <ChevronRight />
        </div>

        {/* Account Section */}
        <SectionLabel>Account</SectionLabel>

        <div
          onClick={() => setShowFeedback(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 14,
            cursor: 'pointer', transition: 'var(--transition)', marginBottom: 8
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(139,92,246,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Send Feedback</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Help us improve Spendly</div>
          </div>
          <ChevronRight />
        </div>

        {/* Sign Out */}
        <div
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'rgba(244,63,94,.05)',
            border: '1px solid rgba(244,63,94,.15)', borderRadius: 14,
            cursor: 'pointer', transition: 'var(--transition)'
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(244,63,94,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>
            🚪
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--red)' }}>
            Sign Out
          </div>
        </div>

        {/* App Info */}
        <div style={{
          textAlign: 'center', marginTop: 36, paddingBottom: 20
        }}>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 4
          }}>
            Spendly
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>v1.0</div>
        </div>
      </div>

      {/* THEME SHEET */}
      {showThemeSheet && (
        <div className="overlay" onClick={() => setShowThemeSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 4, fontSize: 20 }}>
              Choose Theme
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Pick your preferred look
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {themes.map(theme => {
                const isSelected = settings.theme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => { updateSettings({ theme: theme.id }); setShowThemeSheet(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isSelected ? `${theme.color}12` : 'var(--card2)',
                      border: `1.5px solid ${isSelected ? `${theme.color}40` : 'var(--border)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isSelected ? `${theme.color}18` : 'var(--card)',
                      border: `1px solid ${isSelected ? `${theme.color}30` : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                    }}>
                      {theme.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? theme.color : 'var(--text)', marginBottom: 1 }}>
                        {theme.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{theme.desc}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: `2px solid ${isSelected ? theme.color : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: theme.color }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CURRENCY SHEET */}
      {showCurrencySheet && (
        <div className="overlay" onClick={() => setShowCurrencySheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 4, fontSize: 20 }}>
              Select Currency
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Choose your default currency
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CURRENCIES.map(currency => {
                const isSelected = settings.currency === currency.code;
                return (
                  <div
                    key={currency.code}
                    onClick={() => { updateSettings({ currency: currency.code }); setShowCurrencySheet(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isSelected ? 'rgba(16,185,129,.08)' : 'var(--card2)',
                      border: `1.5px solid ${isSelected ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isSelected ? 'rgba(16,185,129,.12)' : 'var(--card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700, color: isSelected ? 'var(--green)' : 'var(--muted)',
                      fontFamily: 'var(--font-head)'
                    }}>
                      {currency.symbol}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? 'var(--green)' : 'var(--text)' }}>
                        {currency.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currency.code}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div className="overlay" onClick={() => setShowFeedback(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <FeedbackModal
              user={user}
              showToast={ctx.showToast}
              onClose={() => setShowFeedback(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};