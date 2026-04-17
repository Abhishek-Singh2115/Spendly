import { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';

export const AddBudgetSheet = ({ onClose, onSave, onDelete, editBudget, existingCategories, currencySymbol }) => {
  const [category, setCategory] = useState(editBudget?.category || '');
  const [amount, setAmount] = useState(editBudget?.amount?.toString() || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Filter out salary/income categories and already-budgeted ones (unless editing)
  const availableCategories = CATEGORIES.filter(c =>
    c.id !== 'salary' &&
    (editBudget ? true : !existingCategories?.includes(c.id))
  );

  const handleSave = () => {
    if (!category) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    onSave({ category, amount: parsedAmount });
  };

  const handleDelete = () => {
    if (editBudget?.id) {
      onDelete(editBudget.id);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 20
        }}>
          {editBudget ? 'Edit Budget' : 'Add Budget'}
        </div>

        {/* Category Selection */}
        <div className="input-group">
          <label>Category</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8
          }}>
            {availableCategories.map(cat => (
              <div
                key={cat.id}
                className={`cat-item${category === cat.id ? ' selected' : ''}`}
                onClick={() => setCategory(cat.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="cat-emoji">{cat.emoji}</span>
                {cat.label}
              </div>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="input-group" style={{ marginTop: 16 }}>
          <label>Budget Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              fontWeight: 600,
              fontSize: 16
            }}>
              {currencySymbol}
            </span>
            <input
              className="input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ paddingLeft: 36, fontSize: 18, fontWeight: 600 }}
              autoFocus
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[500, 1000, 2000, 5000, 10000].map(val => (
            <button
              key={val}
              className="pill"
              onClick={() => setAmount(val.toString())}
              style={{ fontSize: 12 }}
            >
              {formatCurrency(val, currencySymbol)}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleSave}
          disabled={!category || !amount || parseFloat(amount) <= 0}
          style={{
            opacity: (!category || !amount || parseFloat(amount) <= 0) ? 0.5 : 1,
            marginBottom: 10
          }}
        >
          {editBudget ? 'Update Budget' : 'Add Budget'}
        </button>

        {/* Delete Button (edit mode only) */}
        {editBudget && !showConfirmDelete && (
          <button
            className="btn btn-danger btn-full"
            onClick={() => setShowConfirmDelete(true)}
          >
            Delete Budget
          </button>
        )}

        {editBudget && showConfirmDelete && (
          <div style={{
            display: 'flex',
            gap: 8,
            animation: 'fadeSlide 0.2s ease both'
          }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={handleDelete}
            >
              Confirm Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
