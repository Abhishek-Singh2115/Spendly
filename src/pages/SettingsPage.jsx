import { useState } from 'react';
import { Icon } from '../components/common/Icon';
import { CURRENCIES } from '../utils/constants';
import { FeedbackModal } from '../components/settings/FeedbackModal';

export const SettingsPage = ({ ctx, onLogout }) => {
  const { user, settings, updateSettings } = ctx;
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const themes = [
    { id: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on the eyes at night' },
    { id: 'light', label: 'Light Mode', icon: '☀️', desc: 'Bright and clean' },
    { id: 'system', label: 'System Default', icon: '💻', desc: 'Follows your device setting' },
  ];

  return (
    <div>
      <div className="page-top">
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 20
        }}>
          Settings
        </div>

        {/* Profile Card */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20
        }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 50,
            background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#fff',
            fontWeight: 700
          }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user.email}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Appearance */}
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 700,
          letterSpacing: '.08em',
          marginBottom: 8,
          textTransform: 'uppercase'
        }}>
          Appearance
        </div>

        <div className="settings-row" onClick={() => setShowThemeSheet(true)}>
          <div className="settings-row-left">
            <div className="settings-icon" style={{ background: 'rgba(99,102,241,.15)' }}>
              🎨
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {themes.find(t => t.id === settings.theme)?.label || 'Dark Mode'}
              </div>
            </div>
          </div>
          <Icon name="arrow_left" size={16} color="var(--muted)" />
        </div>

        {/* Currency */}
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 700,
          letterSpacing: '.08em',
          marginBottom: 8,
          marginTop: 16,
          textTransform: 'uppercase'
        }}>
          Currency
        </div>

        <div className="settings-row" onClick={() => setShowCurrencySheet(true)}>
          <div className="settings-row-left">
            <div className="settings-icon" style={{ background: 'rgba(16,185,129,.15)' }}>
              💱
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Currency</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {CURRENCIES.find(c => c.code === settings.currency)?.symbol} — {settings.currency}
              </div>
            </div>
          </div>
          <Icon name="arrow_left" size={16} color="var(--muted)" />
        </div>

        {/* Account */}
        <div style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontWeight: 700,
          letterSpacing: '.08em',
          marginBottom: 8,
          marginTop: 16,
          textTransform: 'uppercase'
        }}>
          Account
        </div>

        <div
          className="settings-row"
          onClick={() => setShowFeedback(true)}
        >
          <div className="settings-row-left">
            <div className="settings-icon" style={{ background: 'rgba(99,102,241,.15)' }}>
              💬
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Send Feedback
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Help us improve Spendly
              </div>
            </div>
          </div>
          <Icon name="arrow_left" size={16} color="var(--muted)" />
        </div>

        <div
          className="settings-row btn-danger"
          onClick={onLogout}
          style={{
            borderColor: 'rgba(244,63,94,.3)',
            background: 'rgba(244,63,94,.06)'
          }}
        >
          <div className="settings-row-left">
            <div className="settings-icon" style={{ background: 'rgba(244,63,94,.15)' }}>
              🚪
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>
              Sign Out
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 32,
          color: 'var(--muted2)',
          fontSize: 12
        }}>
          Spendly v1.0
        </div>
      </div>

      {/* THEME SHEET */}
      {showThemeSheet && (
        <div className="overlay" onClick={() => setShowThemeSheet(false)}>
          <div
            className="sheet"
            onClick={e => e.stopPropagation()}
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="sheet-handle" />
            <div style={{ fontWeight: 700, marginBottom: 16 }}>
              Choose Theme
            </div>

            <div className="radio-group">
              {themes.map(theme => (
                <div
                  key={theme.id}
                  className={`radio-option${settings.theme === theme.id ? ' selected' : ''}`}
                  onClick={() => {
                    updateSettings({ theme: theme.id });
                    setShowThemeSheet(false);
                  }}
                >
                  <span style={{ fontSize: 20 }}>{theme.icon}</span>
                  <div className="radio-dot" />
                  <div>
                    <div className="radio-label">{theme.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {theme.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CURRENCY SHEET */}
      {showCurrencySheet && (
        <div className="overlay" onClick={() => setShowCurrencySheet(false)}>
          <div
            className="sheet"
            onClick={e => e.stopPropagation()}
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="sheet-handle" />
            <div style={{ fontWeight: 700, marginBottom: 16 }}>
              Select Currency
            </div>

            <div className="radio-group">
              {CURRENCIES.map(currency => (
                <div
                  key={currency.code}
                  className={`radio-option${settings.currency === currency.code ? ' selected' : ''}`}
                  onClick={() => {
                    updateSettings({ currency: currency.code });
                    setShowCurrencySheet(false);
                  }}
                >
                  <span style={{
                    fontSize: 22,
                    fontWeight: 700,
                    width: 32,
                    textAlign: 'center',
                    color: 'var(--accent)'
                  }}>
                    {currency.symbol}
                  </span>
                  <div className="radio-dot" />
                  <div>
                    <div className="radio-label">{currency.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {currency.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div className="overlay" onClick={() => setShowFeedback(false)}>
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '85vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
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