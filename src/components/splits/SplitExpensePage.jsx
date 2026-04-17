import { useState } from 'react';
import { Icon } from '../common/Icon';
import { BackButton } from '../common/BackButton';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Calculator } from '../common/Calculator';
import { CategorySheet } from '../sheets/CategorySheet';
import { AddFriendSheet } from '../sheets/AddFriendSheet';
import { SplitMethodSheet } from '../sheets/SplitMethodSheet';
import { formatCurrency, getCategory, getToday, generateId } from '../../utils/helpers';
import { SPLIT_METHODS } from '../../utils/constants';

export const SplitExpensePage = ({ ctx, account }) => {
  const { accounts, addTransaction, showToast, currencySymbol, user } = ctx;
  const acc = accounts.find(a => a.id === account?.id) || accounts[0];


  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getToday());
  const [splitMethod, setSplitMethod] = useState('equal');
  const [participants, setParticipants] = useState([
    { id: 'me', name: user.name, email: user.email, amount: 0, percentage: 0, shares: 1 }
  ]);

  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showAddFriendSheet, setShowAddFriendSheet] = useState(false);
  const [showSplitMethodSheet, setShowSplitMethodSheet] = useState(false);

  const addDigit = (digit) => {
    setAmount(prev => prev === '0' ? digit : prev.length > 9 ? prev : prev + digit);
  };

  const addDot = () => {
    setAmount(prev => prev.includes('.') ? prev : (prev || '0') + '.');
  };

  const backspace = () => {
    setAmount(prev => prev.length <= 1 ? '' : prev.slice(0, -1));
  };

  const addParticipant = (friend) => {
    if (participants.find(p => p.email === friend.email)) {
      showToast('Friend already added');
      return;
    }
    setParticipants(prev => [...prev, { ...friend, id: generateId(), amount: 0, percentage: 0, shares: 1 }]);
  };

  const removeParticipant = (id) => {
    if (id === 'me') {
      showToast('Cannot remove yourself');
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateParticipantAmount = (id, value) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, amount: parseFloat(value) || 0 } : p
    ));
  };

  const updateParticipantPercentage = (id, value) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, percentage: parseFloat(value) || 0 } : p
    ));
  };

  const updateParticipantShares = (id, value) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, shares: parseInt(value) || 1 } : p
    ));
  };

  const calculateSplits = () => {
    const totalAmount = parseFloat(amount) || 0;

    switch (splitMethod) {
      case 'equal': {
        const equalShare = totalAmount / participants.length;
        return participants.map(p => ({ ...p, amount: equalShare }));
      }

      case 'exact':
        return participants;

      case 'percentage':
        return participants.map(p => ({
          ...p,
          amount: (totalAmount * p.percentage) / 100
        }));

      case 'shares': {
        const totalShares = participants.reduce((sum, p) => sum + p.shares, 0);
        return participants.map(p => ({
          ...p,
          amount: (totalAmount * p.shares) / totalShares
        }));
      }

      default:
        return participants;
    }
  };

  const splits = calculateSplits();
  const myShare = splits.find(s => s.id === 'me')?.amount || 0;
  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValidSplit = Math.abs(totalSplit - parseFloat(amount || 0)) < 0.01;

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid amount');
      return;
    }

    if (!isValidSplit && splitMethod === 'exact') {
      showToast('Split amounts must equal total');
      return;
    }

    if (splitMethod === 'percentage') {
      const totalPercentage = participants.reduce((sum, p) => sum + p.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        showToast('Percentages must add up to 100%');
        return;
      }
    }

    if (acc && myShare > acc.balance) {
      showToast('Insufficient balance for your share');
      return;
    }

    // Create the split expense
    const splitData = {
      id: generateId(),
      totalAmount: amt,
      myShare,
      category,
      description,
      date,
      splitMethod,
      participants: splits,
      settledWith: [],
      createdAt: new Date().toISOString(),
    };

    // Add transaction for my share
    if (acc) {
      addTransaction({
        accountId: acc.id,
        amount: myShare,
        type: 'expense',
        category,
        description: `${description} (Split: ${participants.length} people)`,
        date,
        splitId: splitData.id,
      });
    }

    // Store split data
    ctx.addSplitExpense(splitData);

    showToast('Split expense created!');
    ctx.setPageStack(prev => {
      const newStack = prev.slice(0, -1);
      return [
        ...newStack,
        {
          page: 'splitDetail',
          data: {
            ...splitData,
            source: account?.source // ⭐ THIS IS THE KEY FIX
          }
        }
      ];
    });
  };

  const categoryObj = getCategory(category);
  const splitMethodObj = SPLIT_METHODS.find(m => m.id === splitMethod);

  return (
    <div style={{ padding: 18, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      <BackButton
        onClick={() => {
          if (account?.source === 'home') {
            ctx.setPageStack([]);
            ctx.setTab('home'); // ✅ go back to home
          } else {
            ctx.setPageStack([]);
            ctx.setTab('groups'); // ✅ keep your working splits flow
          }
        }}
      />

      <div style={{
        fontFamily: 'var(--font-head)',
        fontSize: 20,
        fontWeight: 700,
        marginBottom: 4
      }}>
        Split Expense
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
        {acc ? `${acc.name} · Balance: ${formatCurrency(acc.balance, currencySymbol)}` : 'Split bill with friends'}
      </div>

      {/* Amount display */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>TOTAL AMOUNT</div>
        <div style={{
          fontFamily: 'var(--font-head)',
          fontSize: 52,
          fontWeight: 700,
          color: 'var(--red)',
          letterSpacing: '-2px',
          minHeight: 64
        }}>
          {currencySymbol}{amount || '0'}
        </div>
        {amount && myShare > 0 && (
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
            Your share: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {formatCurrency(myShare, currencySymbol)}
            </span>
          </div>
        )}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em'
        }}>
          Category
        </div>
        <button
          className="btn btn-ghost btn-full"
          onClick={() => setShowCategorySheet(true)}
          style={{ justifyContent: 'flex-start', gap: 10 }}
        >
          <span style={{ fontSize: 20 }}>{categoryObj.emoji}</span>
          <span>{categoryObj.label}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>▾</span>
        </button>
      </div>

      {/* Split Method */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12, color: 'var(--muted)', marginBottom: 6,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em'
        }}>
          Split Method
        </div>
        <button
          className="btn btn-ghost btn-full"
          onClick={() => setShowSplitMethodSheet(true)}
          style={{ justifyContent: 'flex-start', gap: 10, padding: '14px 14px' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99,102,241,.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>
            {splitMethodObj.icon}
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{splitMethodObj.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{splitMethodObj.desc}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>

      {/* Participants */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12, color: 'var(--muted)', marginBottom: 8,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>Participants ({participants.length})</span>
          <button
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,.15), rgba(139,92,246,.1))',
              color: 'var(--accent)', border: '1px solid rgba(99,102,241,.3)',
              padding: '5px 12px', fontSize: 11, gap: 4, borderRadius: 20
            }}
            onClick={() => setShowAddFriendSheet(true)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Friend
          </button>
        </div>

        {/* Live Validation Bar for non-equal methods */}
        {splitMethod !== 'equal' && amount && (
          <div style={{
            marginBottom: 10, padding: '10px 14px',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12
          }}>
            {splitMethod === 'exact' && (() => {
              const totalAmt = parseFloat(amount) || 0;
              const filled = totalSplit;
              const pct = totalAmt > 0 ? Math.min((filled / totalAmt) * 100, 100) : 0;
              const isValid = Math.abs(filled - totalAmt) < 0.01;
              const barColor = isValid ? 'var(--green)' : filled > totalAmt ? 'var(--red)' : 'var(--accent)';
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>
                      {isValid ? '✅' : filled > totalAmt ? '🔴' : '📝'} Amount assigned
                    </span>
                    <span style={{ fontWeight: 700, color: barColor, fontFamily: 'var(--font-head)' }}>
                      {formatCurrency(filled, currencySymbol)} / {formatCurrency(totalAmt, currencySymbol)}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </>
              );
            })()}
            {splitMethod === 'percentage' && (() => {
              const totalPct = participants.reduce((s, p) => s + (p.percentage || 0), 0);
              const pct = Math.min(totalPct, 100);
              const isValid = Math.abs(totalPct - 100) < 0.01;
              const barColor = isValid ? 'var(--green)' : totalPct > 100 ? 'var(--red)' : 'var(--yellow)';
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>
                      {isValid ? '✅' : totalPct > 100 ? '🔴' : '📊'} Percentage assigned
                    </span>
                    <span style={{ fontWeight: 700, color: barColor, fontFamily: 'var(--font-head)' }}>
                      {totalPct}% / 100%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </>
              );
            })()}
            {splitMethod === 'shares' && (() => {
              const totalShares = participants.reduce((s, p) => s + (p.shares || 1), 0);
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>🍕 Total shares</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-head)' }}>
                    {totalShares} shares = {formatCurrency(parseFloat(amount) || 0, currencySymbol)}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Participant Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participants.map((participant, index) => {
            const split = splits[index];
            const isMe = participant.id === 'me';
            const totalShares = participants.reduce((s, p) => s + (p.shares || 1), 0);
            const sharePercent = totalShares > 0 ? Math.round(((participant.shares || 1) / totalShares) * 100) : 0;

            return (
              <div key={participant.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 14px',
                transition: 'var(--transition)'
              }}>
                {/* Top: Avatar + Name + Amount + Remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: splitMethod !== 'equal' ? 10 : 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: isMe
                      ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                      : `hsl(${(participant.name.charCodeAt(0) * 37) % 360}, 60%, 45%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff',
                    boxShadow: isMe ? '0 2px 8px rgba(99,102,241,.3)' : 'none'
                  }}>
                    {participant.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {participant.name} {isMe && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>(You)</span>}
                    </div>
                    {splitMethod === 'equal' && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Equal share</div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                    color: (split?.amount || 0) > 0 ? 'var(--text)' : 'var(--muted2)'
                  }}>
                    {formatCurrency(split?.amount || 0, currencySymbol)}
                  </div>
                  {!isMe && (
                    <button
                      className="icon-btn"
                      onClick={() => removeParticipant(participant.id)}
                      style={{ padding: 4, marginLeft: 2 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                    </button>
                  )}
                </div>

                {/* Bottom: Method-specific input */}
                {splitMethod === 'exact' && (
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 14, fontWeight: 600, color: 'var(--muted)', pointerEvents: 'none'
                    }}>{currencySymbol}</span>
                    <input
                      type="number" className="input"
                      placeholder="Enter exact amount"
                      value={participant.amount || ''}
                      onChange={e => updateParticipantAmount(participant.id, e.target.value)}
                      style={{ paddingLeft: 28, fontSize: 14, borderRadius: 10, background: 'var(--card2)' }}
                    />
                  </div>
                )}

                {splitMethod === 'percentage' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" className="input"
                      placeholder="Enter percentage"
                      value={participant.percentage || ''}
                      onChange={e => updateParticipantPercentage(participant.id, e.target.value)}
                      style={{ paddingRight: 36, fontSize: 14, borderRadius: 10, background: 'var(--card2)' }}
                    />
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 14, fontWeight: 700, color: 'var(--accent)', pointerEvents: 'none'
                    }}>%</span>
                  </div>
                )}

                {splitMethod === 'shares' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      background: 'var(--card2)', borderRadius: 10,
                      border: '1px solid var(--border)', overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => updateParticipantShares(participant.id, Math.max(1, (participant.shares || 1) - 1))}
                        style={{
                          width: 38, height: 38, border: 'none', background: 'none',
                          color: 'var(--red)', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >−</button>
                      <div style={{
                        width: 44, textAlign: 'center',
                        fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16,
                        color: 'var(--text)', borderLeft: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)', padding: '6px 0'
                      }}>
                        {participant.shares || 1}
                      </div>
                      <button
                        onClick={() => updateParticipantShares(participant.id, (participant.shares || 1) + 1)}
                        style={{
                          width: 38, height: 38, border: 'none', background: 'none',
                          color: 'var(--green)', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >+</button>
                    </div>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{sharePercent}%</span> of total
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation messages */}
        {!isValidSplit && splitMethod === 'exact' && parseFloat(amount) > 0 && (
          <div style={{
            marginTop: 8, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.2)',
            color: 'var(--red)', fontSize: 12, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            Amounts must add up to {formatCurrency(parseFloat(amount), currencySymbol)}
          </div>
        )}
        {splitMethod === 'percentage' && parseFloat(amount) > 0 && (() => {
          const totalPct = participants.reduce((s, p) => s + (p.percentage || 0), 0);
          if (Math.abs(totalPct - 100) >= 0.01 && totalPct > 0) {
            return (
              <div style={{
                marginTop: 8, padding: '8px 12px', borderRadius: 10,
                background: totalPct > 100 ? 'rgba(244,63,94,.08)' : 'rgba(245,158,11,.08)',
                border: `1px solid ${totalPct > 100 ? 'rgba(244,63,94,.2)' : 'rgba(245,158,11,.2)'}`,
                color: totalPct > 100 ? 'var(--red)' : 'var(--yellow)', fontSize: 12, textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                {totalPct > 100 ? `Over by ${(totalPct - 100).toFixed(1)}%` : `${(100 - totalPct).toFixed(1)}% remaining to assign`}
              </div>
            );
          }
          return null;
        })()}
      </div>

      <Input
        label="Description (optional)"
        placeholder="What was this expense for?"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />

      <Calculator
        onDigit={addDigit}
        onDot={addDot}
        onBackspace={backspace}
      />

      <Button
        variant="primary"
        fullWidth
        style={{ marginTop: 14 }}
        onClick={handleSubmit}
        disabled={!isValidSplit && splitMethod === 'exact'}
      >
        Create Split Expense
      </Button>

      <CategorySheet
        isOpen={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        selectedCategory={category}
        onSelect={setCategory}
        excludeSalary={true}
      />

      <AddFriendSheet
        isOpen={showAddFriendSheet}
        onClose={() => setShowAddFriendSheet(false)}
        onAdd={addParticipant}
      />

      <SplitMethodSheet
        isOpen={showSplitMethodSheet}
        onClose={() => setShowSplitMethodSheet(false)}
        selectedMethod={splitMethod}
        onSelect={setSplitMethod}
      />
    </div>
  );
};