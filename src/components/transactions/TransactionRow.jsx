import { Icon } from '../common/Icon';
import { getCategory, formatCurrency } from '../../utils/helpers';

export const TransactionRow = ({ transaction, currencySymbol, onDelete }) => {
  const category = getCategory(transaction.category);
  const date = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="txn-row">
      <div className="txn-icon" style={{ background: `${category.color}20` }}>
        <span>{category.emoji}</span>
      </div>
      <div className="txn-info">
        <div className="txn-name">
          {transaction.description || category.label}
        </div>
        <div className="txn-date">{date}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          className="txn-amount"
          style={{ color: transaction.type === 'income' ? 'var(--green)' : 'var(--red)' }}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount, currencySymbol)}
        </div>
        {onDelete && (
          <button
            className="icon-btn"
            onClick={() => onDelete(transaction.id)}
            style={{ padding: 4 }}
          >
            <Icon name="delete" size={14} />
          </button>
        )}
      </div>
    </div>
  );
};