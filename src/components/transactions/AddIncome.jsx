import { useState } from 'react';
import { Icon } from '../common/Icon';
import { getToday } from '../../utils/helpers';

export const AddIncomePage = ({ ctx, account }) => {
  const { accounts, addTransaction, navigate, goBack, showToast, currencySymbol } = ctx;
  const acc = accounts.find(a => a.id === account.id) || account;
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());

  const addDigit = (digit) => {
    setAmount(prev => prev === '0' ? digit : prev.length > 9 ? prev : prev + digit);
  };

  const addDot = () => {
    setAmount(prev => prev.includes('.') ? prev : (prev || '0') + '.');
  };

  const backspace = () => {
    setAmount(prev => prev.length <= 1 ? '' : prev.slice(0, -1));
  };

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    addTransaction({
      accountId: acc.id,
      amount: amt,
      type: 'income',
      category,
      description,
      date
    });
    showToast('Income added!');
    navigate('accountDetail', acc);
  };

  const incomeCategories = [
    { id: 'salary', label: 'Salary', emoji: '💼' },
    { id: 'other', label: 'Other', emoji: '📦' },
    { id: 'food', label: 'Refund', emoji: '🔄' },
    { id: 'travel', label: 'Transfer', emoji: '🔁' }
  ];

  return (
    <div style={{ padding: 18, height: '100%', overflowY: 'auto' }}>
      <button className="back-btn" onClick={goBack}>
        <Icon name="arrow_left" size={16} />
        Back
      </button>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Add Income
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
        {acc.name}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>AMOUNT</div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 52,
          fontWeight: 700,
          color: 'var(--green)',
          letterSpacing: '-2px',
          minHeight: 64
        }}>
          {currencySymbol}{amount || '0'}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em'
        }}>
          Category
        </div>
        <div className="scroll-x">
          {incomeCategories.map(cat => (
            <button
              key={cat.id}
              className={`pill${category === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>Description (optional)</label>
        <input
          className="input"
          placeholder="Source of income"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div className="calc-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(key => (
          <button
            key={key}
            className={`calc-btn${key === '⌫' ? ' danger' : ''}`}
            onClick={() => key === '⌫' ? backspace() : key === '.' ? addDot() : addDigit(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 14, background: 'var(--green)', borderColor: 'var(--green)' }}
        onClick={handleSubmit}
      >
        Add Income
      </button>
    </div>
  );
};