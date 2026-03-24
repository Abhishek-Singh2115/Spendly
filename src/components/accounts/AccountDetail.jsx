import { Icon } from '../common/Icon';
import { TransactionRow } from '../transactions/TransactionRow';
import { formatCurrency } from '../../utils/helpers';

export const AccountDetailPage = ({ ctx, account }) => {
  const { accounts, transactions, currencySymbol, navigate, goBack, deleteTransaction } = ctx;
  const acc = accounts.find(a => a.id === account.id) || account;
  const txns = transactions.filter(t => t.accountId === acc.id);

  return (
    <div>
      <div style={{ padding: '18px 18px 0' }}>
        <button className="back-btn" onClick={goBack}>
          <Icon name="arrow_left" size={16} />
          Accounts
        </button>

        <div className="account-card">
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 2 }}>
            {acc.name}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 700, color: '#fff' }}>
            {formatCurrency(acc.balance, currencySymbol)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
            {acc.holderName}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-full" style={{ fontSize: 13 }} onClick={() => navigate('addIncome', acc)}>
            <Icon name="arrow_up" size={14} /> Income
          </button>
          <button className="btn btn-primary btn-full" style={{ fontSize: 13 }} onClick={() => navigate('addExpense', acc)}>
            <Icon name="arrow_down" size={14} /> Expense
          </button>
        </div>

        <div className="section-head">
          <span className="section-title">Transactions ({txns.length})</span>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {txns.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">💳</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {txns.map(t => (
              <TransactionRow
                key={t.id}
                transaction={t}
                currencySymbol={currencySymbol}
                onDelete={deleteTransaction}
              />
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => navigate('addExpense', acc)}>
        <Icon name="plus" size={26} color="#fff" />
      </button>
    </div>
  );
};