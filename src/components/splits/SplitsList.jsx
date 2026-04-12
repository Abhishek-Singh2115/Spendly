import { formatCurrency, getCategory } from '../../utils/helpers';

export const SplitsList = ({ splits, currencySymbol, onSplitClick }) => {
  if (splits.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">👥</div>
        <p>No split expenses yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {splits.map(split => {
        const categoryObj = getCategory(split.category);
        const me = split.participants.find(p => p.id === 'me');
        const others = split.participants.filter(p => p.id !== 'me');
        const settledCount = split.settledWith.length;
        const allSettled = settledCount === others.length;
        const totalOwed = others.reduce((sum, p) => {
          if (!split.settledWith.includes(p.id)) {
            return sum + p.amount;
          }
          return sum;
        }, 0);

        return (
          <div
            key={split.id}
            className="card card-sm"
            onClick={() => onSplitClick(split)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: allSettled 
                  ? 'rgba(16,185,129,.2)' 
                  : `${categoryObj.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0
              }}>
                {allSettled ? '✓' : categoryObj.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600,
                  marginBottom: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {split.description || categoryObj.label}
                  {allSettled && (
                    <span style={{ 
                      fontSize: 10, 
                      color: 'var(--green)',
                      background: 'rgba(16,185,129,.15)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600
                    }}>
                      SETTLED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                  {split.participants.length} people · {new Date(split.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  You paid: {formatCurrency(me?.amount || 0, currencySymbol)}
                </div>
                {!allSettled && totalOwed > 0 && (
                  <div style={{ 
                    fontSize: 11, 
                    color: 'var(--green)',
                    fontWeight: 600,
                    marginTop: 2
                  }}>
                    You'll get back: {formatCurrency(totalOwed, currencySymbol)}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 16,
                  fontFamily: 'var(--font-head)',
                  fontWeight: 700,
                  color: allSettled ? 'var(--green)' : 'var(--red)'
                }}>
                  {formatCurrency(split.totalAmount, currencySymbol)}
                </div>
                {!allSettled && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {settledCount}/{others.length} settled
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};