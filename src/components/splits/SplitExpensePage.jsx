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
  const { accounts, addTransaction, navigate, goBack, showToast, currencySymbol, user } = ctx;
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
      case 'equal':
        const equalShare = totalAmount / participants.length;
        return participants.map(p => ({ ...p, amount: equalShare }));
      
      case 'exact':
        return participants;
      
      case 'percentage':
        return participants.map(p => ({
          ...p,
          amount: (totalAmount * p.percentage) / 100
        }));
      
      case 'shares':
        const totalShares = participants.reduce((sum, p) => sum + p.shares, 0);
        return participants.map(p => ({
          ...p,
          amount: (totalAmount * p.shares) / totalShares
        }));
      
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
    navigate('splitDetail', splitData);
  };

  const categoryObj = getCategory(category);
  const splitMethodObj = SPLIT_METHODS.find(m => m.id === splitMethod);

  return (
    <div style={{ padding: 18, height: '100%', overflowY: 'auto', paddingBottom: 100 }}>
      <BackButton onClick={goBack} />
      
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
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em'
        }}>
          Split Method
        </div>
        <button
          className="btn btn-ghost btn-full"
          onClick={() => setShowSplitMethodSheet(true)}
          style={{ justifyContent: 'flex-start', gap: 10 }}
        >
          <span style={{ fontSize: 20 }}>{splitMethodObj.icon}</span>
          <span>{splitMethodObj.label}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>▾</span>
        </button>
      </div>

      {/* Participants */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Participants ({participants.length})</span>
          <button 
            className="btn btn-sm"
            style={{ 
              background: 'rgba(99,102,241,.15)', 
              color: 'var(--accent)',
              border: '1px solid rgba(99,102,241,.3)',
              padding: '4px 10px',
              fontSize: 11
            }}
            onClick={() => setShowAddFriendSheet(true)}
          >
            <Icon name="plus" size={12} /> Add
          </button>
        </div>

        <div className="card" style={{ padding: '8px' }}>
          {participants.map((participant, index) => {
            const split = splits[index];
            return (
              <div key={participant.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 8px',
                borderBottom: index < participants.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: participant.id === 'me' 
                    ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                    : 'var(--card2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: participant.id === 'me' ? '#fff' : 'var(--text)'
                }}>
                  {participant.name[0].toUpperCase()}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {participant.name} {participant.id === 'me' && '(You)'}
                  </div>
                  {splitMethod === 'exact' && (
                    <input
                      type="number"
                      className="input"
                      placeholder="0.00"
                      value={participant.amount || ''}
                      onChange={e => updateParticipantAmount(participant.id, e.target.value)}
                      style={{ 
                        marginTop: 4, 
                        padding: '6px 8px', 
                        fontSize: 12,
                        width: '100%'
                      }}
                    />
                  )}
                  {splitMethod === 'percentage' && (
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={participant.percentage || ''}
                      onChange={e => updateParticipantPercentage(participant.id, e.target.value)}
                      style={{ 
                        marginTop: 4, 
                        padding: '6px 8px', 
                        fontSize: 12,
                        width: '100%'
                      }}
                    />
                  )}
                  {splitMethod === 'shares' && (
                    <input
                      type="number"
                      className="input"
                      placeholder="1"
                      min="1"
                      value={participant.shares || 1}
                      onChange={e => updateParticipantShares(participant.id, e.target.value)}
                      style={{ 
                        marginTop: 4, 
                        padding: '6px 8px', 
                        fontSize: 12,
                        width: '100%'
                      }}
                    />
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-head)',
                    fontWeight: 700,
                    color: 'var(--red)'
                  }}>
                    {formatCurrency(split?.amount || 0, currencySymbol)}
                  </div>
                  {splitMethod === 'percentage' && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {participant.percentage || 0}%
                    </div>
                  )}
                  {splitMethod === 'shares' && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {participant.shares || 1} share{participant.shares !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {participant.id !== 'me' && (
                  <button
                    className="icon-btn"
                    onClick={() => removeParticipant(participant.id)}
                    style={{ padding: 4 }}
                  >
                    <Icon name="delete" size={16} color="var(--red)" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!isValidSplit && splitMethod === 'exact' && (
          <div style={{ 
            color: 'var(--red)', 
            fontSize: 12, 
            marginTop: 6,
            textAlign: 'center'
          }}>
            Total split ({formatCurrency(totalSplit, currencySymbol)}) must equal total amount
          </div>
        )}
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