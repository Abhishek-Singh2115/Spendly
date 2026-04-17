import { Icon } from '../common/Icon';
import { formatCurrency } from '../../utils/helpers';

export const AccountDetailPage = ({ ctx, account }) => {
  const { accounts, currencySymbol, navigate, goBack } = ctx;

  const acc = accounts.find(a => a.id === account.id) || account;

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

          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 34,
            fontWeight: 700,
            color: '#fff'
          }}>
            {formatCurrency(acc.balance, currencySymbol)}
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
            {acc.holderName}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => navigate('addIncome', acc)}
          >
            <Icon name="arrow_up" size={14} /> Income
          </button>

          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('addExpense', acc)}
          >
            <Icon name="arrow_down" size={14} /> Expense
          </button>
        </div>
      </div>

      {/* ❌ NO TRANSACTIONS */}

      {/* ❌ NO FAB BUTTON */}

      <button
        style={{
          width: '90%',
          margin: '20px auto',
          display: 'block',
          background: '#f43f5e',
          color: '#fff',
          padding: '12px',
          borderRadius: '10px',
          border: 'none',
          fontSize: '14px'
        }}
        onClick={() => {
          if (confirm("Delete this account?")) {
            ctx.deleteAccount(acc.id);
            goBack();
          }
        }}
      >
        Delete Account
      </button>
    </div>
  );
};