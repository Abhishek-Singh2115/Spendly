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

/* ── helpers ───────────────────────────────────────────────── */
const getUserName = (u) =>
  u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'User';

// Supabase returns numeric columns as strings — normalise them
const toAccount = (row) => ({ ...row, balance: parseFloat(row.balance) || 0 });
const toTransaction = (row) => ({
  ...row,
  amount:    parseFloat(row.amount) || 0,
  accountId: row.accountId ?? row.account_id ?? null,
  splitId:   row.splitId   ?? row.split_id   ?? null,
  date:      row.date || (row.created_at || '').split('T')[0],
});

/* ── Loading splash ────────────────────────────────────────── */
const LoadingScreen = () => (
  <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)' }}>
    <div style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:900, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
      Spendly
    </div>
    <div style={{ color:'var(--muted)', fontSize:14 }}>Loading…</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
function App() {
  // Auth
  const [session,   setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Data (from Supabase)
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [splits,       setSplits]       = useLocalStorage('sp_splits', []);

  // Settings (device-local is fine)
  const [settings, setSettings] = useLocalStorage('sp_settings', { theme: 'dark', currency: 'INR' });

  // UI
  const [tab,     setTab]     = useState('home');
  const [subPage, setSubPage] = useState(null);
  const { message: toast, showToast } = useToast();

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', settings.theme === 'light');
  }, [settings.theme]);

  /* ── Load data for a logged-in user ── */
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

  /* ── Auth listener ── */
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

  /* ── Derived ── */
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₹';
  const user = session ? {
    id:    session.user.id,
    email: session.user.email,
    name:  getUserName(session.user),
  } : null;

  /* ── Add Account ── */
  const addAccount = async (formData) => {
    if (!session) return null;

    const newAcc = {
      id:          generateId(),
      user_id:     session.user.id,
      name:        formData.name.trim(),
      holderName:  formData.holderName?.trim() || '',
      balance:     parseFloat(formData.startBalance) || 0,
      currency:    formData.currency || settings.currency,
    };

    const { error } = await supabase.from('accounts').insert([newAcc]);
    if (error) {
      console.error('addAccount error:', error.message);
      showToast('Error creating account');
      return null;
    }

    setAccounts(prev => [...prev, newAcc]);

    // Add opening balance transaction
    if (newAcc.balance > 0) {
      await addTransactionInternal({
        accountId:   newAcc.id,
        amount:      newAcc.balance,
        type:        'income',
        category:    'other',
        description: 'Opening Balance',
        date:        getToday(),
      });
    }

    return newAcc;
  };

  /* ── Internal transaction helper (shared by addAccount + addTransaction) ── */
  const addTransactionInternal = async (txn) => {
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

    setTransactions(prev => [toTransaction(row), ...prev]);

    const delta = row.type === 'expense' ? -row.amount : row.amount;
    if (row.accountId) {
      setAccounts(prev =>
        prev.map(a => a.id === row.accountId ? { ...a, balance: a.balance + delta } : a)
      );
      // Sync balance to Supabase
      setAccounts(prev => {
        const updated = prev.find(a => a.id === row.accountId);
        if (updated) {
          supabase.from('accounts').update({ balance: updated.balance + delta }).eq('id', row.accountId);
        }
        return prev;
      });
    }
  };

  /* ── Public addTransaction ── */
  const addTransaction = (txn) => addTransactionInternal(txn);

  /* ── Delete Transaction ── */
  const deleteTransaction = async (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    const { error } = await supabase.from('transactions').delete().eq('id', txnId);
    if (error) { showToast('Error deleting'); return; }

    setTransactions(prev => prev.filter(t => t.id !== txnId));

    if (txn.accountId) {
      const delta = txn.type === 'expense' ? txn.amount : -txn.amount; // reverse
      const acc = accounts.find(a => a.id === txn.accountId);
      if (acc) {
        const newBal = acc.balance + delta;
        setAccounts(prev => prev.map(a => a.id === txn.accountId ? { ...a, balance: newBal } : a));
        await supabase.from('accounts').update({ balance: newBal }).eq('id', txn.accountId);
      }
    }

    showToast('Transaction deleted');
  };

  /* ── Delete Account ── */
  const deleteAccount = async (accountId) => {
    // FK cascade deletes transactions automatically
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) { showToast('Error deleting account'); return; }

    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
    showToast('Account deleted');
  };

  /* ── Splits (local only) ── */
  const addSplitExpense    = (s)  => setSplits(prev => [s, ...prev]);
  const updateSplitExpense = (s)  => setSplits(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteSplitExpense = (id) => {
    setSplits(prev => prev.filter(s => s.id !== id));
    setTransactions(prev => prev.filter(t => t.splitId !== id));
  };

  /* ── Settings ── */
  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }));

  /* ── Navigation ── */
  const navigate = (page, data = null) => setSubPage({ page, data });
  const goBack   = () => setSubPage(null);

  /* ── Logout ── */
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /* ── Context ── */
  const ctx = {
    user, accounts, transactions, splits, settings, currencySymbol,
    addAccount, addTransaction, deleteTransaction, deleteAccount,
    addSplitExpense, updateSplitExpense, deleteSplitExpense,
    updateSettings, navigate, goBack, showToast, setTab,
  };

  /* ── Render ── */
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
