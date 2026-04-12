import { Icon } from '../components/common/Icon';
import { formatCurrency } from '../utils/helpers';

export const AccountsPage = ({ ctx }) => {
  const { accounts, transactions, currencySymbol, navigate } = ctx;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div>
      <div className="page-top">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
              Accounts
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>All Accounts</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('addAccount')}>
            <Icon name="plus" size={14} /> Add
          </button>
        </div>

        <div className="card" style={{
          marginTop: 16,
          background: 'linear-gradient(135deg,#1a1a3e,#1e1040)',
          borderColor: 'rgba(99,102,241,.3)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            Total Balance
          </div>
          <div className="amount-display" style={{
            color: totalBalance >= 0 ? 'var(--green)' : 'var(--red)'
          }}>
            {formatCurrency(totalBalance, currencySymbol)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {accounts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏦</div>
            <p>No accounts yet</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate('addAccount')}
            >
              <Icon name="plus" size={14} /> Add Account
            </button>
          </div>
        ) : (
          accounts.map(account => {
            const accountTransactions = transactions.filter(t => t.accountId === account.id);
            const currentMonth = new Date().getMonth();
            const monthSpend = accountTransactions
              .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div
                key={account.id}
                className="account-card"
                onClick={() => navigate('accountDetail', account)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 2 }}>
                  {account.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 4
                }}>
                  {formatCurrency(account.balance, currencySymbol)}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                    {account.holderName || 'Account Holder'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                    Spent this month: {formatCurrency(monthSpend, currencySymbol)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab" onClick={() => navigate('addAccount')}>
        <Icon name="plus" size={26} color="#fff" />
      </button>
    </div>
  );
};