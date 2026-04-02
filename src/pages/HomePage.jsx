import { useState } from 'react';
import { Icon } from '../components/common/Icon';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { MONTHS } from '../utils/constants';
import { formatCurrency, getGreeting, getCategory } from '../utils/helpers';
 
export const HomePage = ({ ctx }) => {
  const { user, accounts, transactions, currencySymbol, navigate, setTab } = ctx;
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
 
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });
 
  const totalSpent = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
 
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
 
  const recentTransactions = transactions.slice(0, 5);
 
  // Weekly data (last 7 days)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dateString = d.toISOString().split('T')[0];
    const amount = transactions
      .filter(t => t.date === dateString && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      amount
    };
  });
 
  const maxWeek = Math.max(...weekData.map(d => d.amount), 1);
 
  // Category breakdown
  const categoryMap = {};
  monthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
 
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
 
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
 
  return (
    <div>
      {/* Top Section */}
      <div className="page-top" style={{ paddingBottom: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>
              Good {getGreeting()} 👋
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
              {user.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Net Worth</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: 18,
              fontWeight: 700,
              color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)'
            }}>
              {formatCurrency(totalBalance, currencySymbol)}
            </div>
          </div>
        </div>
 
        {/* Month Selector */}
        <div className="month-tabs" style={{ marginBottom: 16 }}>
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
      </div>
 
      {/* Big Spend Card */}
      <div style={{ padding: '0 18px 16px' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg,#1a1a3e,#1e1040)',
          borderColor: 'rgba(99,102,241,.3)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            Total Spent · {MONTHS[selectedMonth]}
          </div>
          <div className="amount-display" style={{ color: '#fff', marginBottom: 12 }}>
            {formatCurrency(totalSpent, currencySymbol)}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Income</div>
              <div style={{
                color: 'var(--green)',
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: 15
              }}>
                {formatCurrency(totalIncome, currencySymbol)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Savings</div>
              <div style={{
                color: totalIncome - totalSpent >= 0 ? 'var(--cyan)' : 'var(--red)',
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: 15
              }}>
                {formatCurrency(totalIncome - totalSpent, currencySymbol)}
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Quick Actions */}
      <div style={{ padding: '0 18px 16px' }}>
        <div className="section-head">
          <span className="section-title">Quick Actions</span>
        </div>
        <div className="scroll-x">
          <div className="quick-action" onClick={() => accounts.length ? navigate('addExpense', accounts[0]) : navigate('addAccount')}>
            <div className="qa-icon">💸</div>
            <span>Add Expense</span>
          </div>
          <div className="quick-action" onClick={() => accounts.length ? navigate('addIncome', accounts[0]) : navigate('addAccount')}>
            <div className="qa-icon">➕</div>
            <span>Add Income</span>
          </div>
          <div className="quick-action" onClick={() => navigate('addAccount')}>
            <div className="qa-icon">🏦</div>
            <span>Add Account</span>
          </div>
          <div className="quick-action" onClick={() => setTab('accounts')}>
            <div className="qa-icon">👁️</div>
            <span>Accounts</span>
          </div>
          <div className="quick-action" onClick={() => setTab('insights')}>
            <div className="qa-icon">🤖</div>
            <span>AI Insights</span>
          </div>
        </div>
      </div>
 
      {/* Weekly Chart */}
      <div style={{ padding: '0 18px 16px' }}>
        <div className="card">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <span className="section-title">This Week</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Daily spending</span>
          </div>
          <div className="chart-bar-wrap" style={{ alignItems: 'flex-end', height: 90 }}>
            {weekData.map((day, index) => {
              const isToday = index === 6;
              const barHeight = Math.max(6, (day.amount / maxWeek) * 70);
              return (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {/* Amount label above bar */}
                  <div style={{
                    fontSize: 9,
                    color: isToday ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: 600,
                    minHeight: 12,
                    textAlign: 'center'
                  }}>
                    {day.amount > 0
                      ? formatCurrency(day.amount, currencySymbol).replace(/\.\d+/, '')
                      : ''}
                  </div>
 
                  {/* Bar */}
                  <div style={{
                    width: '60%',
                    height: `${barHeight}px`,
                    borderRadius: '4px 4px 2px 2px',
                    background: isToday
                      ? 'linear-gradient(180deg, var(--accent), var(--accent2))'
                      : day.amount > 0
                        ? 'rgba(99,102,241,0.25)'
                        : 'var(--card2)',
                    boxShadow: isToday ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
                    transition: 'height 0.3s ease'
                  }} />
 
                  {/* Day label */}
                  <div style={{
                    fontSize: 10,
                    color: isToday ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: isToday ? 700 : 400
                  }}>
                    {day.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
 
      {/* Recent Transactions — fixed height, scrollable */}
      <div style={{ padding: '0 18px 16px' }}>
        <div className="section-head">
          <span className="section-title">Recent Transactions</span>
          <span className="see-all" onClick={() => ctx.setTab('transactions')}>See all</span>
        </div>
        <div className="card" style={{
          padding: '4px 16px',
          maxHeight: 260,
          overflowY: 'auto',
          /* hide scrollbar on webkit but keep scrollability */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.3) transparent'
        }}>
          {recentTransactions.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💸</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            recentTransactions.map(txn => (
              <TransactionRow key={txn.id} transaction={txn} currencySymbol={currencySymbol} />
            ))
          )}
        </div>
      </div>
 
      {/* Top Categories — fixed height, scrollable */}
      {categoryBreakdown.length > 0 && (
        <div style={{ padding: '0 18px 16px' }}>
          <div className="section-head">
            <span className="section-title">Top Categories</span>
            <span className="see-all" onClick={() => setTab('budget')}>Details</span>
          </div>
          <div className="card" style={{
            padding: '12px 16px',
            maxHeight: 220,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(99,102,241,0.3) transparent'
          }}>
            {categoryBreakdown.map(([categoryId, amount]) => {
              const cat = getCategory(categoryId);
              const percentage = totalSpent > 0 ? (amount / totalSpent * 100) : 0;
 
              return (
                <div key={categoryId} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{cat.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</span>
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontFamily: 'var(--font-head)',
                      fontWeight: 700,
                      color: 'var(--red)'
                    }}>
                      {formatCurrency(amount, currencySymbol)}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%`, background: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};