import { useState } from 'react';

export const TransactionsPage = ({ ctx }) => {
  const { transactions, deleteTransaction, currencySymbol } = ctx;

  const [selectedCategory, setSelectedCategory] = useState('all');

  // ✅ Category Meta (icons + colors)
  const CATEGORY_META = {
    food: { icon: '🍔', color: '#f59e0b' },
    bills: { icon: '💡', color: '#3b82f6' },
    shopping: { icon: '🛍️', color: '#ec4899' },
    transport: { icon: '🚗', color: '#10b981' },
    education: { icon: '📚', color: '#8b5cf6' },
    travel: { icon: '✈️', color: '#06b6d4' },
    health: { icon: '💊', color: '#ef4444' },
    other: { icon: '📦', color: '#64748b' }
  };

  // ✅ Get categories
  const categories = ['all', ...new Set(transactions.map(t => t.category))];

  // ✅ Filter
  const filtered = selectedCategory === 'all'
    ? transactions
    : transactions.filter(t => t.category === selectedCategory);

  // ✅ Format Date
  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();

    if (d.toDateString() === today.toDateString()) return 'Today';

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="page fade-slide">

      {/* HEADER */}
      <div style={{ padding: '18px 18px 10px' }}>
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'var(--font-head)'
        }}>
          Transactions
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Track all your spending
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        padding: '0 18px 12px'
      }}>
        {categories.map(cat => (
          <div
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: '1px solid var(--border)',
              background:
                selectedCategory === cat
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,0.03)',
              color:
                selectedCategory === cat
                  ? '#fff'
                  : 'var(--muted)'
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <div style={{ padding: '0 18px' }}>
        {filtered.length === 0 ? (
          <div className="empty">No transactions</div>
        ) : (
          filtered.map(txn => {
            const meta = CATEGORY_META[txn.category] || CATEGORY_META.other;

            return (
              <div
                key={txn.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px',
                  borderRadius: 16,
                  marginBottom: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(6px)',
                  transition: '0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* LEFT */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  {/* ICON */}
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${meta.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18
                  }}>
                    {meta.icon}
                  </div>

                  {/* TEXT */}
                  <div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {txn.description || txn.category}
                    </div>

                    <div style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      marginTop: 2
                    }}>
                      {formatDate(txn.date)}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 6
                }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    color:
                      txn.type === 'expense'
                        ? '#ff4d6d'
                        : '#22c55e'
                  }}>
                    {txn.type === 'expense' ? '-' : '+'}
                    {currencySymbol}{txn.amount}
                  </div>

                  {/* DELETE */}
                  <div
                    onClick={() => deleteTransaction(txn.id)}
                    style={{
                      fontSize: 12,
                      opacity: 0.6,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};