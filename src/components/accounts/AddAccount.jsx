import { useState } from 'react';
import { CURRENCIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

const ACCOUNT_TYPES = [
  { id: 'bank', label: 'Bank', icon: '🏦', color: '#6366f1' },
  { id: 'cash', label: 'Cash', icon: '💵', color: '#10b981' },
  { id: 'card', label: 'Card', icon: '💳', color: '#8b5cf6' },
  { id: 'wallet', label: 'Wallet', icon: '📱', color: '#f59e0b' },
  { id: 'savings', label: 'Savings', icon: '🏧', color: '#06b6d4' },
  { id: 'other', label: 'Other', icon: '🪙', color: '#ec4899' },
];

export const AddAccountPage = ({ ctx }) => {
  const { addAccount, goBack, showToast, settings, currencySymbol } = ctx;

  const [form, setForm] = useState({
    name: '',
    holderName: '',
    startBalance: '',
    currency: settings.currency
  });

  const [accountType, setAccountType] = useState('bank');
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('Please enter account name');
      return;
    }

    setLoading(true);
    const acc = await addAccount(form);
    setLoading(false);

    if (!acc) return;

    showToast('Account created!');

    // ✅ FIXED NAVIGATION (no stack issue)
    ctx.setPageStack(prev => {
      const newStack = prev.slice(0, -1);
      return [...newStack, { page: 'accountDetail', data: acc }];
    });
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.id === accountType);
  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency);

  return (
    <div style={{ padding: 18, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      {/* Back Button */}
      <button className="back-btn" onClick={goBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header with preview card */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          New Account
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Add a bank account, wallet or card
        </div>
      </div>

      {/* Live Preview Card */}
      <div style={{
        background: `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}cc)`,
        borderRadius: 'var(--radius)', padding: '18px 20px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        <div style={{ position: 'absolute', right: 30, bottom: -30, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>
            {selectedType.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {form.name || 'Account Name'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
              {form.holderName || 'Holder Name'}
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700,
          color: '#fff', position: 'relative', zIndex: 1
        }}>
          {form.startBalance
            ? formatCurrency(parseFloat(form.startBalance) || 0, selectedCurrency?.symbol || currencySymbol)
            : `${selectedCurrency?.symbol || currencySymbol}0.00`}
        </div>
      </div>

      {/* Account Type */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 12, color: 'var(--muted)', marginBottom: 8,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Account Type
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8
        }}>
          {ACCOUNT_TYPES.map(type => (
            <div
              key={type.id}
              onClick={() => setAccountType(type.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                background: accountType === type.id ? `${type.color}15` : 'var(--card2)',
                border: `1.5px solid ${accountType === type.id ? `${type.color}40` : 'var(--border)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: 22 }}>{type.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: accountType === type.id ? type.color : 'var(--muted)'
              }}>
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Name */}
      <div className="input-group">
        <label>Account Name *</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, pointerEvents: 'none'
          }}>{selectedType.icon}</span>
          <input
            className="input"
            placeholder="e.g. HDFC Savings"
            value={form.name}
            onChange={e => updateForm('name', e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Holder Name */}
      <div className="input-group">
        <label>Account Holder Name</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, pointerEvents: 'none'
          }}>👤</span>
          <input
            className="input"
            placeholder="Your name"
            value={form.holderName}
            onChange={e => updateForm('holderName', e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Starting Balance */}
      <div className="input-group">
        <label>Starting Balance</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, fontWeight: 600, color: 'var(--muted)', pointerEvents: 'none'
          }}>{selectedCurrency?.symbol || currencySymbol}</span>
          <input
            className="input"
            type="number"
            placeholder="0.00"
            value={form.startBalance}
            onChange={e => updateForm('startBalance', e.target.value)}
            style={{ paddingLeft: 30 }}
          />
        </div>
      </div>

      {/* Currency */}
      <div className="input-group">
        <label>Currency</label>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 4, scrollbarWidth: 'none'
        }}>
          {CURRENCIES.map(c => (
            <div
              key={c.code}
              onClick={() => updateForm('currency', c.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                flexShrink: 0, transition: 'all 0.2s ease',
                background: form.currency === c.code ? 'rgba(99,102,241,.12)' : 'var(--card2)',
                border: `1.5px solid ${form.currency === c.code ? 'rgba(99,102,241,.4)' : 'var(--border)'}`,
              }}
            >
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: form.currency === c.code ? 'var(--accent)' : 'var(--muted)'
              }}>
                {c.symbol}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: form.currency === c.code ? 'var(--accent)' : 'var(--muted)'
              }}>
                {c.code}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        className="btn btn-full"
        style={{
          marginTop: 12, opacity: loading ? 0.7 : 1,
          background: `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}cc)`,
          color: '#fff', border: 'none', padding: '14px 20px',
          fontSize: 15, fontWeight: 700, borderRadius: 14,
          boxShadow: `0 6px 20px ${selectedType.color}40`,
          transition: 'all 0.2s ease', gap: 8
        }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          'Creating…'
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Create Account
          </>
        )}
      </button>
    </div>
  );
};