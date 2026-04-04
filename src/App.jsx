import { supabase } from './supabase';
import { useState, useEffect, useCallback } from 'react';
import { BottomNav }         from './components/common/BottomNav';
import { Toast }             from './components/common/Toast';
import { LoginPage }         from './pages/LoginPage';
import { HomePage }          from './pages/HomePage';
import { AccountsPage }      from './pages/AccountsPage';
import { BudgetPage }        from './pages/BudgetPage';
import { SplitsPage }        from './pages/SplitsPage';
import { InsightsPage }      from './pages/InsightsPage';
import { SettingsPage }      from './pages/SettingsPage';
import { TransactionsPage }  from './pages/TransactionsPage';
import { AddAccountPage }    from './components/accounts/AddAccount';
import { AccountDetailPage } from './components/accounts/AccountDetail';
import { AddExpensePage }    from './components/transactions/AddExpense';
import { AddIncomePage }     from './components/transactions/AddIncome';
import { SplitExpensePage }  from './components/splits/SplitExpensePage';
import { SplitDetailPage }   from './components/splits/SplitDetailPage';
import { useLocalStorage }   from './hooks/useLocalStorage';
import { useToast }          from './hooks/useToast';
import { generateId, getToday } from './utils/helpers';
import { CURRENCIES }        from './utils/constants';

const getUserName = (u) =>
  u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'User';

const toAccount = (row) => ({ ...row, balance: parseFloat(row.balance) || 0 });
const toTransaction = (row) => ({
  ...row,
  amount:    parseFloat(row.amount) || 0,
  accountId: row.accountId ?? row.account_id ?? null,
  splitId:   row.splitId   ?? row.split_id   ?? null,
  date:      row.date || (row.created_at || '').split('T')[0],
});

const LoadingScreen = () => (
  <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)' }}>
    <div style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:900, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
      Spendly
    </div>
    <div style={{ color:'var(--muted)', fontSize:14 }}>Loading…</div>
  </div>
);

function App() {
  const [session,   setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [splits,       setSplits]       = useLocalStorage('sp_splits', []);
  const [settings,     setSettings]     = useLocalStorage('sp_settings', { theme: 'dark', currency: 'INR' });
  const [tab,     setTab]     = useState('home');
  const [subPage, setSubPage] = useState(null);
  const { message: toast, showToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', settings.theme === 'light');
  }, [settings.theme]);

  const loadUserData = useCallback(async (userId) => {
    const [{ data: accs, error: aErr }, { data: txns, error: tErr }] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (aErr) console.error('accounts fetch:', aErr.message);
    else setAccounts((accs || []).map(toAccount));
    if (tErr) console.error('transactions fetch:', tErr.message);
    else setTransactions((txns || []).map(toTransaction));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadUserData(s.user.id);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadUserData(s.user.id);
      else { setAccounts([]); setTransactions([]); setTab('home'); setSubPage(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₹';
  const user = session ? {
    id: session.user.id, email: session.user.email, name: getUserName(session.user),
  } : null;

  // ─────────────────────────────────────────────────────────
  // ADD ACCOUNT
  // The account is saved to DB with the correct starting balance.
  // We insert the Opening Balance transaction record for history,
  // but we do NOT touch the balance again — it's already correct.
  // ─────────────────────────────────────────────────────────
  const addAccount = async (formData) => {
    if (!session) return null;

    const startBalance = parseFloat(formData.startBalance) || 0;
    const newAcc = {
      id:         generateId(),
      user_id:    session.user.id,
      name:       formData.name.trim(),
      holderName: formData.holderName?.trim() || '',
      balance:    startBalance,           // ← correct balance saved once
      currency:   formData.currency || settings.currency,
    };

    const { error } = await supabase.from('accounts').insert([newAcc]);
    if (error) {
      console.error('addAccount error:', error.message);
      showToast('Error creating account');
      return null;
    }

    // Add to local state immediately with correct balance
    setAccounts(prev => [...prev, newAcc]);

    // Insert Opening Balance transaction record (history only — no balance update)
    if (startBalance > 0) {
      const obTxn = {
        id:          generateId(),
        user_id:     session.user.id,
        accountId:   newAcc.id,
        amount:      startBalance,
        type:        'income',
        category:    'other',
        description: 'Opening Balance',
        date:        getToday(),
        splitId:     null,
        isOpeningBalance: true,          // flag so delete knows not to touch balance
      };
      const { error: txnErr } = await supabase.from('transactions').insert([{
        id:          obTxn.id,
        user_id:     obTxn.user_id,
        accountId:   obTxn.accountId,
        amount:      obTxn.amount,
        type:        obTxn.type,
        category:    obTxn.category,
        description: obTxn.description,
        date:        obTxn.date,
        splitId:     null,
      }]);
      if (!txnErr) {
        setTransactions(prev => [toTransaction(obTxn), ...prev]);
      }
    }

    return newAcc;
  };

  // ─────────────────────────────────────────────────────────
  // ADD TRANSACTION (expenses, income — NOT opening balance)
  // Single setAccounts call to avoid race conditions / double-delta
  // ─────────────────────────────────────────────────────────
  const addTransaction = async (txn) => {
    if (!session) return;

    const row = {
      id:          txn.id || generateId(),
      user_id:     session.user.id,
      accountId:   txn.accountId || null,
      amount:      parseFloat(txn.amount),
      type:        txn.type,
      category:    txn.category || 'other',
      description: txn.description || '',
      date:        txn.date || getToday(),
      splitId:     txn.splitId || null,
    };

    const { error } = await supabase.from('transactions').insert([row]);
    if (error) { console.error('addTransaction error:', error.message); return; }

    // Add to local transactions list
    setTransactions(prev => [toTransaction(row), ...prev]);

    // Update balance in ONE setAccounts call — compute new balance and sync to DB
    if (row.accountId) {
      const delta = row.type === 'expense' ? -row.amount : row.amount;
      setAccounts(prev => {
        const acc = prev.find(a => a.id === row.accountId);
        if (!acc) return prev;
        const newBalance = acc.balance + delta;
        // Persist to Supabase (fire and forget — no await needed here)
        supabase.from('accounts').update({ balance: newBalance }).eq('id', row.accountId);
        return prev.map(a => a.id === row.accountId ? { ...a, balance: newBalance } : a);
      });
    }
  };

  // ─────────────────────────────────────────────────────────
  // DELETE TRANSACTION
  // Opening Balance: just remove the record, do NOT change balance
  //   (the account was created with that balance — removing the
  //    history entry shouldn't zero out the account)
  // Normal transactions: reverse the delta as before
  // ─────────────────────────────────────────────────────────
  const deleteTransaction = async (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    const isOpeningBalance = txn.description === 'Opening Balance';

    const { error } = await supabase.from('transactions').delete().eq('id', txnId);
    if (error) { showToast('Error deleting'); return; }

    // Remove from local list
    setTransactions(prev => prev.filter(t => t.id !== txnId));

    if (!isOpeningBalance && txn.accountId) {
      // Reverse the transaction delta
      const delta = txn.type === 'expense' ? txn.amount : -txn.amount;
      setAccounts(prev => {
        const acc = prev.find(a => a.id === txn.accountId);
        if (!acc) return prev;
        const newBalance = acc.balance + delta;
        supabase.from('accounts').update({ balance: newBalance }).eq('id', txn.accountId);
        return prev.map(a => a.id === txn.accountId ? { ...a, balance: newBalance } : a);
      });
    }
    // If it IS the Opening Balance — we only delete the record,
    // balance stays as-is (the account was set up with that amount)

    showToast('Transaction deleted');
  };

  // ─────────────────────────────────────────────────────────
  // DELETE ACCOUNT (cascade deletes transactions via FK)
  // ─────────────────────────────────────────────────────────
  const deleteAccount = async (accountId) => {
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) { showToast('Error deleting account'); return; }
    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
    showToast('Account deleted');
  };

  const addSplitExpense    = (s)  => setSplits(prev => [s, ...prev]);
  const updateSplitExpense = (s)  => setSplits(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteSplitExpense = (id) => {
    setSplits(prev => prev.filter(s => s.id !== id));
    setTransactions(prev => prev.filter(t => t.splitId !== id));
  };

  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }));
  const navigate = (page, data = null) => setSubPage({ page, data });
  const goBack   = () => setSubPage(null);
  const handleLogout = async () => await supabase.auth.signOut();

  const ctx = {
    user, accounts, transactions, splits, settings, currencySymbol,
    addAccount, addTransaction, deleteTransaction, deleteAccount,
    addSplitExpense, updateSplitExpense, deleteSplitExpense,
    updateSettings, navigate, goBack, showToast, setTab,
  };

  if (!authReady) return <LoadingScreen />;
  if (!session)   return <LoginPage />;

  const renderSubPage = () => {
    if (!subPage) return null;
    switch (subPage.page) {
      case 'addAccount':    return <AddAccountPage    ctx={ctx} />;
      case 'accountDetail': return <AccountDetailPage ctx={ctx} account={subPage.data} />;
      case 'addExpense':    return <AddExpensePage    ctx={ctx} account={subPage.data} />;
      case 'addIncome':     return <AddIncomePage     ctx={ctx} account={subPage.data} />;
      case 'splitExpense':  return <SplitExpensePage  ctx={ctx} account={subPage.data} />;
      case 'splitDetail':   return <SplitDetailPage   ctx={ctx} split={subPage.data} />;
      default:              return null;
    }
  };

  const renderTab = () => {
    switch (tab) {
      case 'home':         return <HomePage         ctx={ctx} />;
      case 'accounts':     return <AccountsPage     ctx={ctx} />;
      case 'budget':       return <BudgetPage       ctx={ctx} />;
      case 'groups':       return <SplitsPage       ctx={ctx} />;
      case 'insights':     return <InsightsPage     ctx={ctx} />;
      case 'settings':     return <SettingsPage     ctx={ctx} onLogout={handleLogout} />;
      case 'transactions': return <TransactionsPage ctx={ctx} />;
      default:             return <HomePage         ctx={ctx} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {subPage ? (
        <div className="page fade-slide">{renderSubPage()}</div>
      ) : (
        <>
          <div className="page fade-slide">{renderTab()}</div>
          <BottomNav active={tab} onChange={t => { setTab(t); setSubPage(null); }} />
        </>
      )}
      <Toast message={toast} />
    </div>
  );
}

export default App;