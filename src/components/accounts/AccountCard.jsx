import { formatCurrency } from '../../utils/helpers';

export const AccountCard = ({ account, currencySymbol, onClick }) => {
  return (
    <div
      className="account-card"
      onClick={onClick}
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
          {account.currency || 'INR'}
        </div>
      </div>
    </div>
  );
};