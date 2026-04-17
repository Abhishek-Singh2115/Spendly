import { useState, useEffect, useCallback } from 'react';
import { MONTHS, CATEGORIES } from '../utils/constants';
import { formatCurrency, getCategory, generateId } from '../utils/helpers';
import { AddBudgetSheet } from '../components/sheets/AddBudgetSheet';
import { supabase } from '../supabase';

export const BudgetPage = ({ ctx }) => {
  const { user, transactions, currencySymbol } = ctx;
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [showSheet, setShowSheet] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [showUnbudgeted, setShowUnbudgeted] = useState(false);

  // Load budgets from Supabase
  const loadBudgets = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) { console.error('budgets fetch:', error.message); return; }
    setBudgets(data || []);
  }, [user?.id]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  // Filter budgets for selected month
  const monthBudgets = budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);

  // Get expenses for the selected month
  const monthExpenses = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && t.type === 'expense';
  });

  // Category spending map
  const spendingMap = {};
  monthExpenses.forEach(t => {
    spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
  });

  // Total budget & spent
  const totalBudgeted = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpentInBudgeted = monthBudgets.reduce((s, b) => s + (spendingMap[b.category] || 0), 0);
  const totalRemaining = totalBudgeted - totalSpentInBudgeted;
  const overallPercent = totalBudgeted > 0 ? Math.min((totalSpentInBudgeted / totalBudgeted) * 100, 100) : 0;

  // Unbudgeted categories that have spending
  const budgetedCategoryIds = monthBudgets.map(b => b.category);
  const unbudgetedSpending = Object.entries(spendingMap)
    .filter(([catId]) => !budgetedCategoryIds.includes(catId))
    .sort((a, b) => b[1] - a[1]);

  const totalUnbudgetedSpent = unbudgetedSpending.reduce((s, [, amt]) => s + amt, 0);

  // Helpers
  const getStatusColor = (percent) => {
    if (percent >= 100) return 'var(--red)';
    if (percent >= 75) return 'var(--yellow)';
    return 'var(--green)';
  };

  const getStatusLabel = (percent) => {
    if (percent >= 100) return 'Overspent';
    if (percent >= 90) return 'Almost there';
    if (percent >= 75) return 'Warning';
    return 'On track';
  };

  // CRUD
  const handleSaveBudget = async (data) => {
    if (editBudget) {
      const { error } = await supabase.from('budgets')
        .update({ amount: data.amount, category: data.category })
        .eq('id', editBudget.id);
      if (error) { ctx.showToast('Error updating budget'); return; }
      setBudgets(prev => prev.map(b => b.id === editBudget.id ? { ...b, amount: data.amount, category: data.category } : b));
    } else {
      const newBudget = {
        id: generateId(),
        user_id: user.id,
        category: data.category,
        amount: data.amount,
        month: selectedMonth,
        year: selectedYear
      };
      const { error } = await supabase.from('budgets').insert([newBudget]);
      if (error) { ctx.showToast('Error adding budget'); return; }
      setBudgets(prev => [...prev, newBudget]);
    }
    setShowSheet(false);
    setEditBudget(null);
    ctx.showToast(editBudget ? 'Budget updated' : 'Budget added');
  };

  const handleDeleteBudget = async (budgetId) => {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    if (error) { ctx.showToast('Error deleting budget'); return; }
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    setShowSheet(false);
    setEditBudget(null);
    ctx.showToast('Budget removed');
  };

  const handleEditBudget = (budget) => {
    setEditBudget(budget);
    setShowSheet(true);
  };

  const handleCopyFromLastMonth = async () => {
    const lastMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const lastYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lastMonthBudgets = budgets.filter(b => b.month === lastMonth && b.year === lastYear);

    if (lastMonthBudgets.length === 0) {
      ctx.showToast('No budgets from last month');
      return;
    }

    const newBudgets = lastMonthBudgets.map(b => ({
      id: generateId(),
      user_id: user.id,
      category: b.category,
      amount: b.amount,
      month: selectedMonth,
      year: selectedYear
    }));

    const { error } = await supabase.from('budgets').insert(newBudgets);
    if (error) { ctx.showToast('Error copying budgets'); return; }
    setBudgets(prev => [...prev, ...newBudgets]);
    ctx.showToast(`Copied ${newBudgets.length} budgets`);
  };

  // Circumference for SVG ring
  const ringRadius = 54;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (overallPercent / 100) * ringCirc;

  return (
    <div>
      {/* Header */}
      <div className="page-top">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
            Budget
          </div>
          {monthBudgets.length > 0 && (
            <button
              className="pill active"
              onClick={() => { setEditBudget(null); setShowSheet(true); }}
              style={{ fontSize: 13, gap: 4 }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add
            </button>
          )}
        </div>

        {/* Month tabs */}
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

        {/* Summary Card */}
        {monthBudgets.length > 0 && (
          <div className="budget-summary-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Progress Ring */}
              <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r={ringRadius} fill="none"
                    stroke={getStatusColor(totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0)}
                    strokeWidth="10"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {Math.round(totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0)}%
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    used
                  </div>
                </div>
              </div>

              {/* Summary details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {MONTHS[selectedMonth]} Budget
                </div>
                <div style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 12,
                  letterSpacing: '-0.5px'
                }}>
                  {formatCurrency(totalBudgeted, currencySymbol)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Spent</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-head)' }}>
                      {formatCurrency(totalSpentInBudgeted, currencySymbol)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Remaining</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: totalRemaining >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-head)' }}>
                      {totalRemaining >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalRemaining), currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 18px' }}>
        {/* Empty State */}
        {monthBudgets.length === 0 ? (
          <div className="budget-empty-state">
            {/* Decorative background orbs */}
            <div className="budget-empty-orbs">
              <div className="budget-orb budget-orb-1" />
              <div className="budget-orb budget-orb-2" />
              <div className="budget-orb budget-orb-3" />
            </div>

            {/* Animated illustration */}
            <div className="budget-empty-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="28" width="10" height="24" rx="3" fill="url(#bar1)" className="budget-bar-anim budget-bar-1" />
                <rect x="18" y="18" width="10" height="34" rx="3" fill="url(#bar2)" className="budget-bar-anim budget-bar-2" />
                <rect x="32" y="8" width="10" height="44" rx="3" fill="url(#bar3)" className="budget-bar-anim budget-bar-3" />
                <rect x="46" y="22" width="10" height="30" rx="3" fill="url(#bar4)" className="budget-bar-anim budget-bar-4" />
                <line x1="0" y1="53" x2="56" y2="53" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
                <defs>
                  <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                  <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient id="bar4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#c4b5fd" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
              background: 'linear-gradient(135deg, var(--text), var(--muted))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              No budgets for {MONTHS[selectedMonth]}
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--muted)',
              marginBottom: 24,
              maxWidth: 280,
              lineHeight: 1.6
            }}>
              Create spending limits for your categories and stay in control of your finances
            </div>

            <button
              className="btn budget-cta-btn"
              onClick={() => { setEditBudget(null); setShowSheet(true); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Budget
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCopyFromLastMonth}
              style={{ fontSize: 12, marginTop: 10, gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy from {MONTHS[selectedMonth === 0 ? 11 : selectedMonth - 1]}
            </button>

            {/* Tips */}
            <div style={{ marginTop: 32, width: '100%' }}>
              <div style={{ fontSize: 11, color: 'var(--muted2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'left' }}>
                💡 Quick tips
              </div>
              {[
                { icon: '🎯', text: 'Set budgets for your top spending categories' },
                { icon: '📊', text: 'Track progress with visual indicators' },
                { icon: '🔔', text: 'Get alerts when you\'re close to limits' },
              ].map((tip, i) => (
                <div key={i} className="budget-tip-card">
                  <span style={{ fontSize: 16 }}>{tip.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Budget Cards */}
            {monthBudgets
              .map(budget => {
                const category = getCategory(budget.category);
                const spent = spendingMap[budget.category] || 0;
                const remaining = budget.amount - spent;
                const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const displayPercent = Math.min(percent, 100);
                const statusColor = getStatusColor(percent);
                const statusLabel = getStatusLabel(percent);

                return (
                  <div
                    key={budget.id}
                    className="budget-card"
                    onClick={() => handleEditBudget(budget)}
                  >
                    {/* Top row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `${category.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20
                        }}>
                          {category.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{category.label}</div>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: statusColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <div style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: statusColor,
                              animation: percent >= 100 ? 'pulse-dot 1.5s ease infinite' : 'none'
                            }} />
                            {statusLabel}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'var(--font-head)',
                          fontWeight: 700,
                          fontSize: 16,
                          color: percent >= 100 ? 'var(--red)' : 'var(--text)'
                        }}>
                          {formatCurrency(spent, currencySymbol)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          of {formatCurrency(budget.amount, currencySymbol)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="budget-progress-bar">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${displayPercent}%`,
                          background: percent >= 100
                            ? 'linear-gradient(90deg, var(--yellow), var(--red))'
                            : percent >= 75
                              ? 'linear-gradient(90deg, var(--green), var(--yellow))'
                              : `linear-gradient(90deg, ${category.color}, ${category.color}cc)`
                        }}
                      />
                    </div>

                    {/* Bottom row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {Math.round(percent)}% used
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: remaining >= 0 ? 'var(--green)' : 'var(--red)'
                      }}>
                        {remaining >= 0
                          ? `${formatCurrency(remaining, currencySymbol)} left`
                          : `${formatCurrency(Math.abs(remaining), currencySymbol)} over`
                        }
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Copy from last month */}
            <button
              className="btn btn-ghost btn-sm btn-full"
              onClick={handleCopyFromLastMonth}
              style={{ marginTop: 4, marginBottom: 12, fontSize: 12, justifyContent: 'center' }}
            >
              📋 Copy budgets from {MONTHS[selectedMonth === 0 ? 11 : selectedMonth - 1]}
            </button>

            {/* Unbudgeted Categories */}
            {unbudgetedSpending.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div
                  className="section-head"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowUnbudgeted(!showUnbudgeted)}
                >
                  <span className="section-title" style={{ fontSize: 14, color: 'var(--muted)' }}>
                    Unbudgeted Spending
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--red)',
                      fontFamily: 'var(--font-head)'
                    }}>
                      {formatCurrency(totalUnbudgetedSpent, currencySymbol)}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      transition: 'transform 0.2s ease',
                      transform: showUnbudgeted ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {showUnbudgeted && (
                  <div style={{ animation: 'fadeSlide 0.25s ease both' }}>
                    {unbudgetedSpending.map(([categoryId, amount]) => {
                      const category = getCategory(categoryId);
                      return (
                        <div
                          key={categoryId}
                          className="card card-sm"
                          style={{
                            marginBottom: 8,
                            cursor: 'pointer',
                            opacity: 0.8
                          }}
                          onClick={() => {
                            setEditBudget(null);
                            setShowSheet(true);
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: `${category.color}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 17
                              }}>
                                {category.emoji}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{category.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--accent)' }}>Tap to set budget</div>
                              </div>
                            </div>
                            <div style={{
                              fontFamily: 'var(--font-head)',
                              fontWeight: 700,
                              fontSize: 14,
                              color: 'var(--red)'
                            }}>
                              {formatCurrency(amount, currencySymbol)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {monthBudgets.length > 0 && (
        <button
          className="fab"
          onClick={() => { setEditBudget(null); setShowSheet(true); }}
        >
          +
        </button>
      )}

      {/* Add/Edit Sheet */}
      {showSheet && (
        <AddBudgetSheet
          onClose={() => { setShowSheet(false); setEditBudget(null); }}
          onSave={handleSaveBudget}
          onDelete={handleDeleteBudget}
          editBudget={editBudget}
          existingCategories={monthBudgets.map(b => b.category)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};