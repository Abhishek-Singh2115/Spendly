import { formatCurrency } from '../utils/helpers';

export const AccountsPage = ({ ctx }) => {
  const { accounts, transactions, currencySymbol, navigate } = ctx;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Account type icons/colors
  const getAccountStyle = (index) => {
    const styles = [
      { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)', icon: '🏦' },
      { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', icon: '💳' },
      { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)', icon: '💰' },
      { gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)', icon: '🪙' },
      { gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)', icon: '📱' },
    ];
    return styles[index % styles.length];
  };

  return (
    <div>
      <div className="page-top">
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 16
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
              Accounts
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Manage your finances
            </div>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => navigate('addAccount')}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff', border: 'none', gap: 5, borderRadius: 20,
              boxShadow: '0 3px 12px rgba(99,102,241,.3)', padding: '8px 16px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add
          </button>
        </div>

        {/* Total Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a3e 0%, #1e1040 60%, #0f172a 100%)',
          border: '1px solid rgba(99,102,241,.2)',
          borderRadius: 'var(--radius)', padding: '20px 22px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(139,92,246,.08)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(99,102,241,.06)', pointerEvents: 'none'
          }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Balance
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 700,
            color: totalBalance >= 0 ? '#fff' : 'var(--red)',
            letterSpacing: '-1px', marginBottom: 6
          }}>
            {formatCurrency(totalBalance, currencySymbol)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: totalBalance >= 0 ? 'var(--green)' : 'var(--red)',
              boxShadow: `0 0 8px ${totalBalance >= 0 ? 'rgba(16,185,129,.5)' : 'rgba(244,63,94,.5)'}`
            }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {totalBalance >= 0 ? 'Healthy' : 'Negative'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px 24px' }}>
        {accounts.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', padding: '50px 20px'
          }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(139,92,246,.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, fontSize: 40
            }}>
              🏦
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              No accounts yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, maxWidth: 240, lineHeight: 1.5 }}>
              Add your bank accounts or wallets to start tracking
            </div>
            <button
              className="btn"
              onClick={() => navigate('addAccount')}
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: '#fff', border: 'none', gap: 6,
                boxShadow: '0 6px 20px rgba(99,102,241,.35)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add Your First Account
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((account, index) => {
              const style = getAccountStyle(index);
              const accountTxns = transactions.filter(t => t.accountId === account.id);
              const currentMonth = new Date().getMonth();
              const monthSpend = accountTxns
                .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
                .reduce((sum, t) => sum + t.amount, 0);
              const monthIncome = accountTxns
                .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
                .reduce((sum, t) => sum + t.amount, 0);

              return (
                <div
                  key={account.id}
                  onClick={() => navigate('accountDetail', account)}
                  style={{
                    background: style.gradient,
                    borderRadius: 'var(--radius)', padding: '18px 20px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 16px rgba(0,0,0,.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.2)'; }}
                >
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                  <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

                  {/* Top: Icon + Name + Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                      }}>
                        {style.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{account.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>
                          {account.holderName || 'Account Holder'}
                        </div>
                      </div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>

                  {/* Balance */}
                  <div style={{
                    fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700,
                    color: '#fff', letterSpacing: '-0.5px', marginBottom: 12, position: 'relative', zIndex: 1
                  }}>
                    {formatCurrency(account.balance, currencySymbol)}
                  </div>

                  {/* Bottom stats */}
                  <div style={{
                    display: 'flex', gap: 16, position: 'relative', zIndex: 1,
                    borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(244,63,94,.8)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Spent</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', fontFamily: 'var(--font-head)' }}>
                        {formatCurrency(monthSpend, currencySymbol)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,.8)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Income</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', fontFamily: 'var(--font-head)' }}>
                        {formatCurrency(monthIncome, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};