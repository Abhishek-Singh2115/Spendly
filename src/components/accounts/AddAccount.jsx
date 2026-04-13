import { useState } from 'react';
import { Icon } from '../common/Icon';
import { CURRENCIES } from '../../utils/constants';

export const AddAccountPage = ({ ctx }) => {
  const { addAccount, navigate, goBack, showToast, settings } = ctx;
  const [form, setForm] = useState({
    name: '',
    holderName: '',
    startBalance: '',
    currency: settings.currency
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ✅ FIXED: handleSubmit is now async and properly awaits addAccount
  // Previously: const acc = addAccount(form)  ← returned a Promise, not the account!
  // Now:        const acc = await addAccount(form) ← waits for the real account object
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('Please enter account name');
      return;
    }
    setLoading(true);
    const acc = await addAccount(form);   // ← await is the critical fix
    setLoading(false);
    if (!acc) return;                     // addAccount returns null on error
    showToast('Account created!');
    navigate('accountDetail', acc);       // now acc is the real account object
  };

  return (
    <div style={{ padding: 18 }}>
      <button className="back-btn" onClick={goBack}>
        <Icon name="arrow_left" size={16} />
        Back
      </button>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        New Account
      </div>

      <div className="input-group">
        <label>Account Name *</label>
        <input
          className="input"
          placeholder="e.g. HDFC Savings"
          value={form.name}
          onChange={e => updateForm('name', e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Account Holder Name</label>
        <input
          className="input"
          placeholder="Your name"
          value={form.holderName}
          onChange={e => updateForm('holderName', e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Starting Balance</label>
        <input
          className="input"
          type="number"
          placeholder="0.00"
          value={form.startBalance}
          onChange={e => updateForm('startBalance', e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Currency</label>
        <select className="input" value={form.currency} onChange={e => updateForm('currency', e.target.value)}>
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Creating…' : 'Create Account'}
      </button>
    </div>
  );
};