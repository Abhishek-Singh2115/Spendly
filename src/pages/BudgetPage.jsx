import { useState } from 'react';
import { MONTHS } from '../utils/constants';
import { formatCurrency, getCategory } from '../utils/helpers';

export const BudgetPage = ({ ctx }) => {
  const { transactions, currencySymbol } = ctx;
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filter, setFilter] = useState('month');

  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    if (filter === 'month') {
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    }
    return date.getFullYear() === selectedYear;
  }).filter(t => t.type === 'expense');

  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = {};
  filteredTransactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="page-top">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Expense Breakdown
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`pill${filter === 'month' ? ' active' : ''}`}
            onClick={() => setFilter('month')}
          >
            Monthly
          </button>
          <button
            className={`pill${filter === 'year' ? ' active' : ''}`}
            onClick={() => setFilter('year')}
          >
            Yearly
          </button>
        </div>

        {filter === 'month' && (
          <div className="month-tabs" style={{ marginBottom: 12 }}>
            {MONTHS.map((month, index) => (
              <button
                key={month}
                className={`pill${selectedMonth === index ? ' active' : ''}`}
                onClick={() => setSelectedMonth(index)}
              >
                {month}
              </button>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            Total Expenses · {filter === 'month' ? `${MONTHS[selectedMonth]} ${selectedYear}` : selectedYear}
          </div>
          <div className="amount-display" style={{ color: 'var(--red)' }}>
            {formatCurrency(total, currencySymbol)}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {categories.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📊</div>
            <p>No expenses for this period</p>
          </div>
        ) : (
          categories.map(([categoryId, amount]) => {
            const category = getCategory(categoryId);
            const percentage = total > 0 ? (amount / total * 100) : 0;

            return (
              <div key={categoryId} className="card card-sm" style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${category.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20
                  }}>
                    {category.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{category.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-head)',
                    fontWeight: 700,
                    color: 'var(--red)',
                    fontSize: 16
                  }}>
                    {formatCurrency(amount, currencySymbol)}
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%`, background: category.color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};