import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, getCategory } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';

export const InsightsPage = ({ ctx }) => {
  const { user, transactions, accounts, splits, currencySymbol } = ctx;
  const [filter, setFilter] = useState('monthly');
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! Ask me anything about your spending, budgets, accounts, or savings.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [budgets, setBudgets] = useState([]);

  // Load budgets from Supabase
  const loadBudgets = useCallback(async () => {
    if (!user?.id) return;
    const now = new Date();
    const { data, error } = await supabase
      .from('budgets').select('*')
      .eq('user_id', user.id)
      .eq('month', now.getMonth())
      .eq('year', now.getFullYear());
    if (error) { console.error('budgets fetch:', error.message); return; }
    setBudgets(data || []);
  }, [user?.id]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  // Date filtering logic
  const getFilteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return transactions.filter(t => {
      const txnDate = new Date(t.date);
      switch (filter) {
        case 'daily': return txnDate >= startOfToday;
        case 'weekly': return txnDate >= startOfWeek;
        case 'monthly': return txnDate >= startOfMonth;
        case 'yearly': return txnDate >= startOfYear;
        default: return true;
      }
    });
  }, [transactions, filter]);

  // Calculate summary
  const summary = useMemo(() => {
    const filtered = getFilteredTransactions;
    const expenses = filtered.filter(t => t.type === 'expense');
    const income = filtered.filter(t => t.type === 'income');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const remaining = totalIncome - totalExpense;
    return { totalExpense, totalIncome, remaining, expenses, income };
  }, [getFilteredTransactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryMap = {};
    summary.expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    
    return Object.entries(categoryMap)
      .map(([id, amount]) => {
        const cat = getCategory(id);
        return {
          name: cat.label,
          value: amount,
          color: cat.color,
          emoji: cat.emoji
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [summary.expenses]);

  // Budget health data
  const budgetHealthData = useMemo(() => {
    return budgets.map(b => {
      const cat = getCategory(b.category);
      const spent = summary.expenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = (parseFloat(b.amount) || 0) - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const status = percentage > 100 ? 'over' : percentage >= 75 ? 'warning' : 'safe';
      return { ...b, cat, spent, remaining, percentage, status };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, summary.expenses]);

  // Budget vs Actual chart data
  const budgetVsActualData = useMemo(() => {
    return budgetHealthData.map(b => ({
      name: b.cat.label,
      budget: parseFloat(b.amount) || 0,
      actual: b.spent,
      color: b.cat.color
    }));
  }, [budgetHealthData]);

  // Account-wise spending
  const accountSpendData = useMemo(() => {
    const map = {};
    summary.expenses.forEach(t => {
      if (!t.accountId) return;
      const acc = accounts.find(a => a.id === t.accountId);
      const name = acc ? acc.name : 'Unknown';
      map[name] = (map[name] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary.expenses, accounts]);

  // Spending velocity (monthly only)
  const spendingVelocity = useMemo(() => {
    if (filter !== 'monthly' || summary.totalExpense === 0) return null;
    const now = new Date();
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyRate = summary.totalExpense / day;
    const projected = dailyRate * daysInMonth;
    const totalBudget = budgets.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
    return { dailyRate, projected, totalBudget, daysInMonth, day };
  }, [filter, summary.totalExpense, budgets]);

  // Recurring expense detection
  const recurringExpenses = useMemo(() => {
    const descMap = {};
    transactions.filter(t => t.type === 'expense' && t.description).forEach(t => {
      const key = t.description.toLowerCase().trim();
      if (!descMap[key]) descMap[key] = [];
      descMap[key].push(t);
    });
    return Object.entries(descMap)
      .filter(([, txns]) => txns.length >= 2 && new Set(txns.map(t => new Date(t.date).getMonth())).size >= 2)
      .map(([, txns]) => ({
        description: txns[0].description,
        avgAmount: txns.reduce((s, t) => s + t.amount, 0) / txns.length,
        count: txns.length,
        cat: getCategory(txns[0].category)
      }))
      .sort((a, b) => b.avgAmount - a.avgAmount)
      .slice(0, 5);
  }, [transactions]);

  // Split summary
  const splitSummary = useMemo(() => {
    if (!splits || splits.length === 0) return null;
    let owedToYou = 0, unsettled = 0;
    splits.forEach(s => {
      const settled = s.settledWith || [];
      (s.participants || []).forEach(p => {
        if (!settled.includes(p.name)) {
          owedToYou += parseFloat(p.share || p.amount || 0);
          unsettled++;
        }
      });
    });
    return unsettled > 0 ? { owedToYou, unsettled } : null;
  }, [splits]);

  // Daily expense trend (last 7 days for daily/weekly, last 30 days for monthly)
  const dailyTrendData = useMemo(() => {
    const days = filter === 'yearly' ? 12 : filter === 'monthly' ? 30 : 7;
    const now = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = summary.expenses.filter(t => t.date === dateStr);
      const total = dayExpenses.reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        date: filter === 'yearly' 
          ? date.toLocaleDateString('en-US', { month: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: total
      });
    }
    return data;
  }, [summary.expenses, filter]);

  // Smart insights
  const insights = useMemo(() => {
    const result = [];
    
    // Top spending category
    if (categoryData.length > 0) {
      const top = categoryData[0];
      result.push({
        icon: top.emoji,
        title: `Top Spending: ${top.name}`,
        body: `You've spent ${formatCurrency(top.value, currencySymbol)} on ${top.name} - your highest category.`,
        color: top.color
      });
    }

    // Spending trend
    if (filter === 'monthly') {
      const thisMonth = summary.totalExpense;
      const lastMonth = transactions.filter(t => {
        const date = new Date(t.date);
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return date.getMonth() === prevMonth && 
               date.getFullYear() === prevYear && 
               t.type === 'expense';
      }).reduce((sum, t) => sum + t.amount, 0);

      if (lastMonth > 0) {
        const diff = thisMonth - lastMonth;
        result.push({
          icon: diff > 0 ? '📈' : '📉',
          title: diff > 0 ? 'Spending Increased' : 'Great! Spending Down',
          body: diff > 0
            ? `You've spent ${formatCurrency(Math.abs(diff), currencySymbol)} more than last month.`
            : `You saved ${formatCurrency(Math.abs(diff), currencySymbol)} compared to last month!`,
          color: diff > 0 ? '#f59e0b' : '#10b981'
        });
      }
    }

    // Savings rate
    if (summary.totalIncome > 0) {
      const savingRate = ((summary.totalIncome - summary.totalExpense) / summary.totalIncome * 100);
      if (savingRate < 20) {
        result.push({
          icon: '💡',
          title: 'Low Savings Rate',
          body: `Your saving rate is ${savingRate.toFixed(0)}%. Try to save at least 20% of your income.`,
          color: '#f59e0b'
        });
      } else if (savingRate >= 30) {
        result.push({
          icon: '🌟',
          title: 'Excellent Saver!',
          body: `You're saving ${savingRate.toFixed(0)}% of your income. Great financial discipline!`,
          color: '#10b981'
        });
      }
    }

    // High spending in specific category
    const entertainment = categoryData.find(c => c.name === 'Fun');
    if (entertainment && summary.totalExpense > 0 && (entertainment.value / summary.totalExpense) > 0.25) {
      result.push({
        icon: '🎬',
        title: 'High Entertainment Spend',
        body: `Entertainment is ${((entertainment.value / summary.totalExpense) * 100).toFixed(0)}% of your spending. Consider reducing it.`,
        color: '#8b5cf6'
      });
    }

    // Budget warnings
    const overBudget = budgetHealthData.filter(b => b.status === 'over');
    const warningBudget = budgetHealthData.filter(b => b.status === 'warning');
    if (overBudget.length > 0) {
      result.push({
        icon: '🚨',
        title: `Over Budget: ${overBudget.map(b => b.cat.label).join(', ')}`,
        body: `${overBudget.length} categor${overBudget.length > 1 ? 'ies have' : 'y has'} exceeded the budget limit.`,
        color: '#f43f5e'
      });
    }
    if (warningBudget.length > 0) {
      result.push({
        icon: '⚠️',
        title: `Nearing Limit: ${warningBudget.map(b => b.cat.label).join(', ')}`,
        body: `${warningBudget.length} categor${warningBudget.length > 1 ? 'ies are' : 'y is'} at 75%+ of budget.`,
        color: '#f59e0b'
      });
    }

    // Spending velocity
    if (spendingVelocity) {
      const { dailyRate, projected, totalBudget } = spendingVelocity;
      result.push({
        icon: '🚀',
        title: 'Spending Velocity',
        body: `You're spending ~${formatCurrency(dailyRate, currencySymbol)}/day. Projected month total: ${formatCurrency(projected, currencySymbol)}.${totalBudget > 0 ? ` Total budget: ${formatCurrency(totalBudget, currencySymbol)}.` : ''}`,
        color: projected > totalBudget && totalBudget > 0 ? '#f43f5e' : '#06b6d4'
      });
    }

    // Split reminder
    if (splitSummary) {
      result.push({
        icon: '🤝',
        title: 'Pending Splits',
        body: `${formatCurrency(splitSummary.owedToYou, currencySymbol)} pending from ${splitSummary.unsettled} unsettled split${splitSummary.unsettled > 1 ? 's' : ''}.`,
        color: '#8b5cf6'
      });
    }

    // Recurring expenses
    if (recurringExpenses.length > 0) {
      const total = recurringExpenses.reduce((s, r) => s + r.avgAmount, 0);
      result.push({
        icon: '🔄',
        title: `${recurringExpenses.length} Recurring Expense${recurringExpenses.length > 1 ? 's' : ''} Detected`,
        body: `Estimated ~${formatCurrency(total, currencySymbol)}/month in recurring costs (${recurringExpenses.map(r => r.description).join(', ')}).`,
        color: '#06b6d4'
      });
    }

    // No transactions
    if (summary.expenses.length === 0 && summary.income.length === 0) {
      result.push({
        icon: '📊',
        title: 'No Data Yet',
        body: 'Start adding transactions to see personalized insights.',
        color: '#6366f1'
      });
    }

    return result;
  }, [categoryData, summary, filter, transactions, currencySymbol, budgetHealthData, spendingVelocity, splitSummary, recurringExpenses]);

  // AI Chat handler
  const handleAskAI = () => {
    if (!chatInput.trim()) return;

    const userMessage = { type: 'user', text: chatInput };
    const aiResponse = { 
      type: 'ai', 
      text: `Based on your ${filter} data: ${generateAIResponse(chatInput, summary, categoryData)}`
    };

    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setChatInput('');
  };

  const generateAIResponse = (question, summary, categoryData) => {
    const q = question.toLowerCase();
    
    if (q.includes('budget')) {
      if (budgetHealthData.length === 0) return 'No budgets set for this month. Go to the Budget tab to create some!';
      const over = budgetHealthData.filter(b => b.status === 'over');
      const safe = budgetHealthData.filter(b => b.status === 'safe');
      let resp = `You have ${budgetHealthData.length} budget(s) this month. `;
      if (over.length > 0) resp += `⚠️ ${over.length} over budget: ${over.map(b => `${b.cat.label} (${b.percentage.toFixed(0)}%)`).join(', ')}. `;
      if (safe.length > 0) resp += `✅ ${safe.length} within limits.`;
      return resp;
    }
    if (q.includes('account')) {
      if (accountSpendData.length === 0) return 'No account-level spending data in this period.';
      return `Account spending: ${accountSpendData.map(a => `${a.name}: ${formatCurrency(a.amount, currencySymbol)}`).join(', ')}.`;
    }
    if (q.includes('split') || q.includes('owe')) {
      if (!splitSummary) return 'No pending splits! All settled.';
      return `You have ${splitSummary.unsettled} unsettled split(s) with ${formatCurrency(splitSummary.owedToYou, currencySymbol)} pending.`;
    }
    if (q.includes('recurring') || q.includes('subscription')) {
      if (recurringExpenses.length === 0) return 'No recurring expenses detected yet. I need at least 2 months of data.';
      return `Detected ${recurringExpenses.length} recurring: ${recurringExpenses.map(r => `${r.description} (~${formatCurrency(r.avgAmount, currencySymbol)}/mo)`).join(', ')}.`;
    }
    if (q.includes('velocity') || q.includes('rate') || q.includes('project')) {
      if (!spendingVelocity) return 'Spending velocity is only available in monthly view.';
      return `Daily rate: ${formatCurrency(spendingVelocity.dailyRate, currencySymbol)}/day. Projected total: ${formatCurrency(spendingVelocity.projected, currencySymbol)} by month end.`;
    }
    if (q.includes('spend') || q.includes('expense')) {
      return `You've spent ${formatCurrency(summary.totalExpense, currencySymbol)} in this period across ${summary.expenses.length} transactions.`;
    }
    if (q.includes('save') || q.includes('saving')) {
      const saved = summary.totalIncome - summary.totalExpense;
      return saved > 0 
        ? `You've saved ${formatCurrency(saved, currencySymbol)}. That's a ${((saved / summary.totalIncome) * 100).toFixed(0)}% savings rate.`
        : `You're currently overspending by ${formatCurrency(Math.abs(saved), currencySymbol)}.`;
    }
    if (q.includes('category') || q.includes('most')) {
      const top = categoryData[0];
      return top 
        ? `Your highest spending is on ${top.name} with ${formatCurrency(top.value, currencySymbol)} (${((top.value / summary.totalExpense) * 100).toFixed(0)}% of total).`
        : 'No expense categories yet.';
    }
    if (q.includes('income')) {
      return `Your total income is ${formatCurrency(summary.totalIncome, currencySymbol)}.`;
    }
    
    return "Try asking about: spending, budget, savings, accounts, splits, recurring expenses, velocity, or categories!";
  };

  // Download report
  const handleDownloadReport = () => {
    let reportText = `
SPENDLY FINANCIAL REPORT
Period: ${filter.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════

SUMMARY
Total Income:    ${formatCurrency(summary.totalIncome, currencySymbol)}
Total Expenses:  ${formatCurrency(summary.totalExpense, currencySymbol)}
Remaining:       ${formatCurrency(summary.remaining, currencySymbol)}

═══════════════════════════════════════

CATEGORY BREAKDOWN
${categoryData.map(c => 
  `${c.emoji} ${c.name}: ${formatCurrency(c.value, currencySymbol)}`
).join('\n')}
`;

    if (budgetHealthData.length > 0) {
      reportText += `
═══════════════════════════════════════

BUDGET HEALTH
${budgetHealthData.map(b =>
  `${b.cat.emoji} ${b.cat.label}: ${formatCurrency(b.spent, currencySymbol)} / ${formatCurrency(parseFloat(b.amount), currencySymbol)} (${b.percentage.toFixed(0)}%) ${b.status === 'over' ? '⚠️ OVER' : b.status === 'warning' ? '⚡ WARNING' : '✅ OK'}`
).join('\n')}
`;
    }

    if (accountSpendData.length > 0) {
      reportText += `
═══════════════════════════════════════

ACCOUNT BREAKDOWN
${accountSpendData.map(a => `💳 ${a.name}: ${formatCurrency(a.amount, currencySymbol)}`).join('\n')}
`;
    }

    if (recurringExpenses.length > 0) {
      reportText += `
═══════════════════════════════════════

RECURRING EXPENSES
${recurringExpenses.map(r => `🔄 ${r.description}: ~${formatCurrency(r.avgAmount, currencySymbol)}/month (${r.count} occurrences)`).join('\n')}
`;
    }

    reportText += `
═══════════════════════════════════════

INSIGHTS
${insights.map(i => `${i.icon} ${i.title}\n   ${i.body}`).join('\n\n')}

═══════════════════════════════════════

Transaction Count: ${summary.expenses.length + summary.income.length}
Expense Transactions: ${summary.expenses.length}
Income Transactions: ${summary.income.length}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly-report-${filter}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-top">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          AI Insights
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Smart analysis of your finances
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
            <button
              key={f}
              className={`pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: filter === f ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: filter === f ? 'rgba(99,102,241,0.15)' : 'var(--card)',
                color: filter === f ? 'var(--accent)' : 'var(--text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Expenses</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--red)' }}>
              {formatCurrency(summary.totalExpense, currencySymbol)}
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Income</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>
              {formatCurrency(summary.totalIncome, currencySymbol)}
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Balance</div>
            <div style={{ 
              fontFamily: 'var(--font-head)', 
              fontWeight: 700, 
              fontSize: 16, 
              color: summary.remaining >= 0 ? 'var(--green)' : 'var(--red)' 
            }}>
              {formatCurrency(summary.remaining, currencySymbol)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Charts Section */}
        {summary.expenses.length > 0 && (
          <>
            {/* Line Chart - Daily Trend */}
            <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4 }}>
                Daily Expense Trend
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    stroke="var(--border)"
                  />
                  <YAxis 
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    stroke="var(--border)"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => formatCurrency(value, currencySymbol)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Category Breakdown */}
            <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4 }}>
                Category Breakdown
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => formatCurrency(value, currencySymbol)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Category Totals */}
            <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4 }}>
                Category Comparison
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--muted)', fontSize: 10 }}
                    stroke="var(--border)"
                  />
                  <YAxis 
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                    stroke="var(--border)"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => formatCurrency(value, currencySymbol)}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Budget Health Section */}
        {budgetHealthData.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎯</span> Budget Health
            </div>
            {budgetHealthData.map((b, i) => (
              <div key={i} className="card card-sm" style={{
                marginBottom: 8,
                borderLeft: `3px solid ${b.status === 'over' ? 'var(--red)' : b.status === 'warning' ? 'var(--yellow)' : 'var(--green)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                    <span>{b.cat.emoji}</span> {b.cat.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: b.status === 'over' ? 'var(--red)' : b.status === 'warning' ? 'var(--yellow)' : 'var(--green)' }}>
                    {b.percentage.toFixed(0)}%
                  </div>
                </div>
                <div className="budget-progress-bar" style={{ marginBottom: 4 }}>
                  <div className="budget-progress-fill" style={{
                    width: `${Math.min(b.percentage, 100)}%`,
                    background: b.status === 'over' ? 'var(--red)' : b.status === 'warning' ? 'var(--yellow)' : 'var(--green)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                  <span>{formatCurrency(b.spent, currencySymbol)} spent</span>
                  <span>{b.remaining >= 0 ? `${formatCurrency(b.remaining, currencySymbol)} left` : `Over by ${formatCurrency(Math.abs(b.remaining), currencySymbol)}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Budget vs Actual Chart */}
        {budgetVsActualData.length > 0 && (
          <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span> Budget vs Actual
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetVsActualData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => formatCurrency(value, currencySymbol)}
                />
                <Bar dataKey="budget" name="Budget" fill="var(--muted2)" radius={[4, 4, 0, 0]} opacity={0.5} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                  {budgetVsActualData.map((entry, index) => (
                    <Cell key={`bva-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Account Spending Breakdown */}
        {accountSpendData.length > 0 && (
          <div className="card" style={{ marginBottom: 16, padding: '16px 12px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💳</span> Spending by Account
            </div>
            {accountSpendData.map((a, i) => {
              const maxAmount = accountSpendData[0]?.amount || 1;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{formatCurrency(a.amount, currencySymbol)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(a.amount / maxAmount) * 100}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Spending Velocity */}
        {spendingVelocity && (
          <div className="card" style={{ marginBottom: 16, padding: '16px', borderLeft: `3px solid ${spendingVelocity.projected > spendingVelocity.totalBudget && spendingVelocity.totalBudget > 0 ? 'var(--red)' : 'var(--cyan)'}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚀</span> Spending Velocity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Daily Rate</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: 'var(--cyan)' }}>
                  {formatCurrency(spendingVelocity.dailyRate, currencySymbol)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Projected Total</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: spendingVelocity.projected > spendingVelocity.totalBudget && spendingVelocity.totalBudget > 0 ? 'var(--red)' : 'var(--text)' }}>
                  {formatCurrency(spendingVelocity.projected, currencySymbol)}
                </div>
              </div>
            </div>
            {spendingVelocity.totalBudget > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                Total budget: {formatCurrency(spendingVelocity.totalBudget, currencySymbol)} · Day {spendingVelocity.day} of {spendingVelocity.daysInMonth}
              </div>
            )}
          </div>
        )}

        {/* Recurring Expenses */}
        {recurringExpenses.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔄</span> Recurring Expenses
            </div>
            {recurringExpenses.map((r, i) => (
              <div key={i} className="card card-sm" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 22 }}>{r.cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.count} times · {r.cat.label}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  ~{formatCurrency(r.avgAmount, currencySymbol)}/mo
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Smart Insights */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span> Smart Insights
          </div>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="card card-sm"
              style={{
                marginBottom: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                borderLeft: `3px solid ${insight.color}`
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1 }}>{insight.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: insight.color }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {insight.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Chat Section */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🤖</span>
            <span>Ask AI Assistant</span>
          </div>
          
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            marginBottom: 12,
            background: 'var(--card2)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 8,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: msg.type === 'user' ? 'var(--accent)' : 'var(--border)',
                  color: msg.type === 'user' ? '#fff' : 'var(--text)',
                  fontSize: '13px',
                  maxWidth: '85%',
                  marginLeft: msg.type === 'user' ? 'auto' : '0',
                  marginRight: msg.type === 'user' ? '0' : 'auto'
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Ask about your spending..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--card2)',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAskAI}
              className="btn btn-primary btn-sm"
            >
              Send
            </button>
          </div>
        </div>

        {/* Report Download */}
        <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            📄 Financial Report
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Download a summary of your {filter} financial data
          </div>
          <button
            onClick={handleDownloadReport}
            className="btn btn-primary btn-full"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};