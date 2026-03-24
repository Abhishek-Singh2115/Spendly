import { formatCurrency, getCategory } from '../utils/helpers';

export const InsightsPage = ({ ctx }) => {
  const { transactions, accounts, currencySymbol } = ctx;

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear() &&
           t.type === 'expense';
  });

  const lastMonth = transactions.filter(t => {
    const date = new Date(t.date);
    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return date.getMonth() === previousMonth &&
           date.getFullYear() === previousYear &&
           t.type === 'expense';
  });

  const thisTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);
  const lastTotal = lastMonth.reduce((sum, t) => sum + t.amount, 0);
  const difference = thisTotal - lastTotal;

  // Top category
  const categoryMap = {};
  thisMonth.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
  const topCategoryObj = topCategory ? getCategory(topCategory[0]) : null;

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

  const insights = [];

  if (topCategoryObj) {
    insights.push({
      icon: topCategoryObj.emoji,
      title: `Top Spending: ${topCategoryObj.label}`,
      body: `You've spent ${formatCurrency(topCategory[1], currencySymbol)} on ${topCategoryObj.label} this month — your highest category.`,
      type: 'info',
      color: topCategoryObj.color,
    });
  }

  if (lastTotal > 0) {
    insights.push({
      icon: difference > 0 ? '📈' : '📉',
      title: difference > 0 ? 'Spending Increased' : 'Great job! Spending Down',
      body: difference > 0
        ? `You've spent ${formatCurrency(Math.abs(difference), currencySymbol)} more than last month. Try to cut back.`
        : `You saved ${formatCurrency(Math.abs(difference), currencySymbol)} compared to last month. Keep it up!`,
      type: difference > 0 ? 'warn' : 'good',
      color: difference > 0 ? '#f59e0b' : '#10b981',
    });
  }

  if (savingRate < 20 && totalIncome > 0) {
    insights.push({
      icon: '💡',
      title: 'Low Savings Rate',
      body: `Your saving rate is ${savingRate.toFixed(0)}%. Financial experts recommend saving at least 20% of income.`,
      type: 'warn',
      color: '#f59e0b',
    });
  } else if (savingRate >= 30) {
    insights.push({
      icon: '🌟',
      title: 'Excellent Saver!',
      body: `You're saving ${savingRate.toFixed(0)}% of your income. That's fantastic financial discipline!`,
      type: 'good',
      color: '#10b981',
    });
  }

  const entertainment = categoryMap['entertain'] || 0;
  if (entertainment > thisTotal * 0.25) {
    insights.push({
      icon: '🎬',
      title: 'High Entertainment Spend',
      body: `Entertainment takes up ${(entertainment / thisTotal * 100).toFixed(0)}% of your spending. Consider reducing it.`,
      type: 'warn',
      color: '#8b5cf6',
    });
  }

  if (totalBalance < 0) {
    insights.push({
      icon: '⚠️',
      title: 'Negative Balance Alert',
      body: 'One or more accounts have a negative balance. Review your expenses immediately.',
      type: 'bad',
      color: '#f43f5e',
    });
  }

  if (accounts.length === 0) {
    insights.push({
      icon: '🏦',
      title: 'No Accounts Yet',
      body: 'Add your first bank account or wallet to start tracking your finances.',
      type: 'info',
      color: '#6366f1',
    });
  }

  insights.push({
    icon: '🎯',
    title: 'Set a Monthly Budget',
    body: 'Creating category budgets helps you stay on track and avoid overspending.',
    type: 'tip',
    color: '#06b6d4',
  });

  const typeColors = {
    info: 'rgba(99,102,241,.12)',
    good: 'rgba(16,185,129,.12)',
    warn: 'rgba(245,158,11,.12)',
    bad: 'rgba(244,63,94,.12)',
    tip: 'rgba(6,182,212,.12)'
  };

  return (
    <div>
      <div className="page-top">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          AI Insights
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Smart analysis of your spending
        </div>

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>This Month</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--red)'
            }}>
              {formatCurrency(thisTotal, currencySymbol)}
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Saving Rate</div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--green)'
            }}>
              {savingRate.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {insights.map((insight, index) => (
          <div
            key={index}
            className="insight-card"
            style={{
              background: typeColors[insight.type] || typeColors.info,
              borderColor: insight.color + '40'
            }}
          >
            <div className="insight-icon">{insight.icon}</div>
            <div>
              <div style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 3,
                color: insight.color
              }}>
                {insight.title}
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: 1.5
              }}>
                {insight.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};