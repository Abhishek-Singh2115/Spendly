import { useState } from 'react';
import { Icon } from '../common/Icon';
import { BackButton } from '../common/BackButton';
import { Button } from '../common/Button';
import { formatCurrency, getCategory } from '../../utils/helpers';

export const SplitDetailPage = ({ ctx, split }) => {
  const { currencySymbol, goBack, showToast, updateSplitExpense } = ctx;
  const [localSplit, setLocalSplit] = useState(split);

  const categoryObj = getCategory(localSplit.category);
  const me = localSplit.participants.find(p => p.id === 'me');
  const others = localSplit.participants.filter(p => p.id !== 'me');

  const toggleSettlement = (participantId) => {
    const isSettled = localSplit.settledWith.includes(participantId);
    const newSettledWith = isSettled
      ? localSplit.settledWith.filter(id => id !== participantId)
      : [...localSplit.settledWith, participantId];

    const updatedSplit = { ...localSplit, settledWith: newSettledWith };
    setLocalSplit(updatedSplit);
    updateSplitExpense(updatedSplit);
    showToast(isSettled ? 'Marked as unsettled' : 'Marked as settled');
  };

  const totalOwed = others.reduce((sum, p) => {
    if (!localSplit.settledWith.includes(p.id)) {
      return sum + p.amount;
    }
    return sum;
  }, 0);

  const allSettled = others.every(p => localSplit.settledWith.includes(p.id));

  return (
    <div style={{ padding: 18 }}>
      <BackButton
        onClick={() => {
          if (localSplit?.source === 'home') {
            ctx.setPageStack([]);
            ctx.setTab('home');   // ✅ go back to Home
          } else {
            ctx.setPageStack([]);
            ctx.setTab('groups'); // ✅ go back to Splits
          }
        }}
        label="Back"
      />

      <div className="card" style={{
        background: allSettled
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'linear-gradient(135deg, var(--accent), var(--accent2))',
        borderColor: 'transparent',
        marginBottom: 20
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 2 }}>
          {allSettled ? '✓ All Settled' : 'Split Expense'}
        </div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 8
        }}>
          {formatCurrency(localSplit.totalAmount, currencySymbol)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{categoryObj.emoji}</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.9)' }}>
            {localSplit.description || categoryObj.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
          {new Date(localSplit.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Your Share */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          Your Share
        </div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--red)'
        }}>
          {formatCurrency(me?.amount || 0, currencySymbol)}
        </div>
      </div>

      {/* Amount to Receive */}
      {!allSettled && totalOwed > 0 && (
        <div className="card" style={{
          marginBottom: 16,
          background: 'rgba(16,185,129,.1)',
          borderColor: 'rgba(16,185,129,.3)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>
            Amount to Receive
          </div>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--green)'
          }}>
            {formatCurrency(totalOwed, currencySymbol)}
          </div>
        </div>
      )}

      {/* Participants */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--muted)',
          fontWeight: 600,
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '.05em'
        }}>
          Split Between ({localSplit.participants.length})
        </div>

        <div className="card" style={{ padding: '8px' }}>
          {localSplit.participants.map((participant, index) => {
            const isSettled = localSplit.settledWith.includes(participant.id);
            const isMe = participant.id === 'me';

            return (
              <div key={participant.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 8px',
                borderBottom: index < localSplit.participants.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: isSettled ? 0.6 : 1
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isMe
                    ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                    : isSettled
                      ? 'var(--green)'
                      : 'var(--card2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  color: (isMe || isSettled) ? '#fff' : 'var(--text)'
                }}>
                  {isSettled ? '✓' : participant.name[0].toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {participant.name} {isMe && '(You)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {isSettled ? 'Settled' : 'Pending'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 15,
                    fontFamily: 'var(--font-head)',
                    fontWeight: 700,
                    color: isSettled ? 'var(--green)' : 'var(--red)',
                    textDecoration: isSettled ? 'line-through' : 'none'
                  }}>
                    {formatCurrency(participant.amount, currencySymbol)}
                  </div>
                </div>

                {!isMe && (
                  <button
                    className="btn btn-sm"
                    style={{
                      background: isSettled ? 'rgba(244,63,94,.15)' : 'rgba(16,185,129,.15)',
                      color: isSettled ? 'var(--red)' : 'var(--green)',
                      border: `1px solid ${isSettled ? 'rgba(244,63,94,.3)' : 'rgba(16,185,129,.3)'}`,
                      padding: '6px 12px',
                      fontSize: 11
                    }}
                    onClick={() => toggleSettlement(participant.id)}
                  >
                    {isSettled ? 'Undo' : 'Settle'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Method Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          Split Method
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {localSplit.splitMethod === 'equal' && '⚖️ Split Equally'}
          {localSplit.splitMethod === 'exact' && '🎯 Exact Amounts'}
          {localSplit.splitMethod === 'percentage' && '📊 By Percentage'}
          {localSplit.splitMethod === 'shares' && '🍕 By Shares'}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          variant="ghost"
          fullWidth
          icon={<Icon name="delete" size={16} />}
          onClick={() => {
            if (confirm('Delete this split expense?')) {
              ctx.deleteSplitExpense(localSplit.id);
              showToast('Split expense deleted');

              ctx.setPageStack([]);

              if (localSplit?.source === 'home') {
                ctx.setTab('home');
              } else {
                ctx.setTab('groups');
              }
            }
          }}
        >
          Delete
        </Button>
        {!allSettled && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              // Settle all
              const allIds = others.map(p => p.id);
              const updatedSplit = { ...localSplit, settledWith: allIds };
              setLocalSplit(updatedSplit);
              updateSplitExpense(updatedSplit);
              showToast('All settled!');
            }}
            style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
          >
            Settle All
          </Button>
        )}
      </div>
    </div>
  );
};