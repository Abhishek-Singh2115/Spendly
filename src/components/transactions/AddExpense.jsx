import { useState } from 'react';
import { Icon } from '../common/Icon';
import { CATEGORIES } from '../../utils/constants';
import { formatCurrency, getCategory, getToday } from '../../utils/helpers';

export const AddExpensePage = ({ ctx, account }) => {
  const { accounts, addTransaction, navigate, goBack, showToast, currencySymbol } = ctx;
  const acc = accounts.find(a => a.id === account.id) || account;
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());
  const [showCategorySheet, setShowCategorySheet] = useState(false);

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
    if (amt > acc.balance) {
      showToast('Insufficient balance');
      return;
    }
    addTransaction({
      accountId: acc.id,
      amount: amt,
      type: 'expense',
      category,
      description,
      date
    });
    showToast('Expense added!');
    navigate('accountDetail', acc);
  };

  const categoryObj = getCategory(category);

  return (
    <div style={{ padding: 18, height: '100%', overflowY: 'auto' }}>
      <button className="back-btn" onClick={goBack}>
        <Icon name="arrow_left" size={16} />
        Back
      </button>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Add Expense
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
        {acc.name} · Balance: {formatCurrency(acc.balance, currencySymbol)}
      </div>

      {/* Amount display */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>AMOUNT</div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 52,
          fontWeight: 700,
          color: 'var(--red)',
          letterSpacing: '-2px',
          minHeight: 64
        }}>
          {currencySymbol}{amount || '0'}
        </div>
      </div>

      {/* Category */}
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
        <button
          className="btn btn-ghost btn-full"
          onClick={() => setShowCategorySheet(true)}
          style={{ justifyContent: 'flex-start', gap: 10 }}
        >
          <span style={{ fontSize: 20 }}>{categoryObj.emoji}</span>
          <span>{categoryObj.label}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>▾</span>
        </button>
      </div>

      {/* Description */}
      <div className="input-group">
        <label>Description (optional)</label>
        <input
          className="input"
          placeholder="What did you spend on?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="input-group">
        <label>Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Calculator */}
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

      <button className="btn btn-primary btn-full" style={{ marginTop: 14 }} onClick={handleSubmit}>
        Add Expense
      </button>

      {/* Category Sheet */}
      {showCategorySheet && (
        <div className="overlay" onClick={() => setShowCategorySheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 16 }}>
              Select Category
            </div>
            <div className="cat-grid">
              {CATEGORIES.filter(c => c.id !== 'salary').map(cat => (
                <div
                  key={cat.id}
                  className={`cat-item${category === cat.id ? ' selected' : ''}`}
                  onClick={() => {
                    setCategory(cat.id);
                    setShowCategorySheet(false);
                  }}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  {cat.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};