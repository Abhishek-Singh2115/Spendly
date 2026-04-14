import { useState } from 'react';
// import { Icon } from '../components/common/Icon';
// import { FAB } from '../components/common/FAB';
import { SplitsList } from '../components/splits/SplitsList';
import { formatCurrency } from '../utils/helpers';
import { Icon } from '../components/common/Icon';

export const SplitsPage = ({ ctx }) => {
  const { splits, currencySymbol, navigate, accounts } = ctx;
  const [filter, setFilter] = useState('all'); // all, pending, settled

  const filteredSplits = splits.filter(split => {
    if (filter === 'pending') {
      const others = split.participants.filter(p => p.id !== 'me');
      return split.settledWith.length < others.length;
    }
    if (filter === 'settled') {
      const others = split.participants.filter(p => p.id !== 'me');
      return split.settledWith.length === others.length;
    }
    return true;
  });

  // Calculate totals
  const totalLent = splits.reduce((sum, split) => {
    const others = split.participants.filter(p => p.id !== 'me');
    const unsettled = others.filter(p => !split.settledWith.includes(p.id));
    return sum + unsettled.reduce((s, p) => s + p.amount, 0);
  }, 0);

  const totalSpent = splits.reduce((sum, split) => {
    const me = split.participants.find(p => p.id === 'me');
    return sum + (me?.amount || 0);
  }, 0);

  return (
    <div>
      <div className="page-top">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>

          {/* LEFT */}
          <div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontSize: 22,
              fontWeight: 700
            }}>
              Split Expenses
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Share bills with friends
            </div>
          </div>

          {/* RIGHT BUTTON */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (accounts.length === 0) {
                ctx.showToast('Add an account first');
                ctx.setTab('accounts');
              } else {
                navigate('splitExpense', {
                  account: accounts[0],
                  source: 'splits'
                });
              }
            }}
          >
            <Icon name="plus" size={14} /> Add Split
          </button>

        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16
        }}>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
              You'll Get Back
            </div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--green)'
            }}>
              {formatCurrency(totalLent, currencySymbol)}
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
              You Paid
            </div>
            <div style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--red)'
            }}>
              {formatCurrency(totalSpent, currencySymbol)}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`pill${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({splits.length})
          </button>
          <button
            className={`pill${filter === 'pending' ? ' active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`pill${filter === 'settled' ? ' active' : ''}`}
            onClick={() => setFilter('settled')}
          >
            Settled
          </button>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        <SplitsList
          splits={filteredSplits}
          currencySymbol={currencySymbol}
          onSplitClick={(split) => navigate('splitDetail', split)}
        />
      </div>

    </div>
  );
};