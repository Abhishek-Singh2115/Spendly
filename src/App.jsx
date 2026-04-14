import { supabase } from './supabase';
import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SplitsPage } from './pages/SplitsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AddAccountPage } from './components/accounts/AddAccount';
import { AccountDetailPage } from './components/accounts/AccountDetail';
import { AddExpensePage } from './components/transactions/AddExpense';
import { AddIncomePage } from './components/transactions/AddIncome';
import { SplitExpensePage } from './components/splits/SplitExpensePage';
import { SplitDetailPage } from './components/splits/SplitDetailPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useToast } from './hooks/useToast';
import { generateId, getToday } from './utils/helpers';
import { CURRENCIES } from './utils/constants';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from "./pages/ResetPassword";

const getUserName = (u) =>
  u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'User';

const toAccount = (row) => ({ ...row, balance: parseFloat(row.balance) || 0 });

const toTransaction = (row) => ({
  ...row,
  amount: parseFloat(row.amount) || 0,
  accountId: row.accountId ?? row.account_id ?? null,
  splitId: row.splitId ?? row.split_id ?? null,
  date: row.date || (row.created_at || '').split('T')[0],
});

// Supabase stores JSONB — parse if it comes back as string
const toSplit = (row) => ({
  ...row,
  participants: typeof row.participants === 'string'
    ? JSON.parse(row.participants) : (row.participants || []),
  settledWith: typeof row.settledWith === 'string'
    ? JSON.parse(row.settledWith) : (row.settledWith || []),
});

const LoadingScreen = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)' }}>
    <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      Spendly
    </div>
    <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // All data from Supabase — no localStorage for user data
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [splits, setSplits] = useState([]);  // ← Supabase now, not localStorage

  // Settings stay device-local
  const [settings, setSettings] = useLocalStorage('sp_settings', { theme: 'dark', currency: 'INR' });

  const [tab, setTab] = useState('home');
  const [pageStack, setPageStack] = useState([]);
  const currentPage = pageStack[pageStack.length - 1] || null;
  const { message: toast, showToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', settings.theme === 'light');
  }, [settings.theme]);

  useEffect(() => {
    const handlePopState = () => {
      setPageStack((prev) => {
        if (prev.length > 0) {
          return prev.slice(0, -1);
        }
        return []; // ✅ IMPORTANT FIX
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Load ALL user data from Supabase ─────────────────────
  const loadUserData = useCallback(async (userId) => {
    const [
      { data: accs, error: aErr },
      { data: txns, error: tErr },
      { data: spls, error: sErr },
    ] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('splits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    if (aErr) console.error('accounts fetch:', aErr.message);
    else setAccounts((accs || []).map(toAccount));

    if (tErr) console.error('transactions fetch:', tErr.message);
    else setTransactions((txns || []).map(toTransaction));

    if (sErr) console.error('splits fetch:', sErr.message);
    else setSplits((spls || []).map(toSplit));
  }, []);
  // ── Auth listener ─────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadUserData(s.user.id);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);

      if (s) {
        loadUserData(s.user.id);

      } else {
        // Clear ALL data on logout — no cross-user leakage
        setAccounts([]);
        setTransactions([]);
        setSplits([]);
        setTab('home');
        setPageStack([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);


  // ── Forgot Password OPEN ─────────────────────────────────
  useEffect(() => {
    const handler = () => {
      console.log("OPEN FORGOT PAGE");
      setPageStack([{ page: "forgotPassword" }]);
    };

    window.addEventListener("open-forgot-password", handler);

    return () => window.removeEventListener("open-forgot-password", handler);
  }, []);


  // ── Forgot Password CLOSE ────────────────────────────────
  useEffect(() => {
    const handler = () => {
      console.log("CLOSE FORGOT PAGE");
      setPageStack([]);
    };

    window.addEventListener("close-forgot-password", handler);

    return () => window.removeEventListener("close-forgot-password", handler);
  }, []);

  // ── USER + CURRENCY (IMPORTANT) ──────────────────────────
  const currencySymbol =
    CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₹';

  const user = session
    ? {
      id: session.user.id,
      email: session.user.email,
      name: getUserName(session.user),
    }
    : null;
  // ── Add Account ───────────────────────────────────────────
  const addAccount = async (formData) => {
    if (!session) return null;
    const startBalance = parseFloat(formData.startBalance) || 0;
    const newAcc = {
      id: generateId(),
      user_id: session.user.id,
      name: formData.name.trim(),
      holderName: formData.holderName?.trim() || '',
      balance: startBalance,
      currency: formData.currency || settings.currency,
    };
    const { error } = await supabase.from('accounts').insert([newAcc]);
    if (error) { console.error('addAccount error:', error.message); showToast('Error creating account'); return null; }
    setAccounts(prev => [...prev, newAcc]);
    if (startBalance > 0) {
      const obTxn = {
        id: generateId(), user_id: session.user.id, accountId: newAcc.id,
        amount: startBalance, type: 'income', category: 'other',
        description: 'Opening Balance', date: getToday(), splitId: null,
      };
      const { error: txnErr } = await supabase.from('transactions').insert([obTxn]);
      if (!txnErr) setTransactions(prev => [toTransaction(obTxn), ...prev]);
    }
    return newAcc;
  };

  // ── Add Transaction ───────────────────────────────────────
  const addTransaction = async (txn) => {
    if (!session) return;
    const row = {
      id: txn.id || generateId(), user_id: session.user.id,
      accountId: txn.accountId || null, amount: parseFloat(txn.amount),
      type: txn.type, category: txn.category || 'other',
      description: txn.description || '', date: txn.date || getToday(),
      splitId: txn.splitId || null,
    };
    const { error } = await supabase.from('transactions').insert([row]);
    if (error) { console.error('addTransaction error:', error.message); return; }
    setTransactions(prev => [toTransaction(row), ...prev]);
    if (row.accountId) {
      const delta = row.type === 'expense' ? -row.amount : row.amount;
      const acc = accounts.find(a => a.id === row.accountId);
      if (acc) {
        const newBalance = acc.balance + delta;
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', row.accountId);
        setAccounts(prev => prev.map(a => a.id === row.accountId ? { ...a, balance: newBalance } : a));
      }
    }
  };

  // ── Delete Transaction ────────────────────────────────────
  const deleteTransaction = async (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;
    const isOpeningBalance = txn.description === 'Opening Balance';
    const { error } = await supabase.from('transactions').delete().eq('id', txnId);
    if (error) { showToast('Error deleting'); return; }
    setTransactions(prev => prev.filter(t => t.id !== txnId));
    if (!isOpeningBalance && txn.accountId) {
      const delta = txn.type === 'expense' ? txn.amount : -txn.amount;
      const acc = accounts.find(a => a.id === txn.accountId);
      if (acc) {
        const newBalance = acc.balance + delta;
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', txn.accountId);
        setAccounts(prev => prev.map(a => a.id === txn.accountId ? { ...a, balance: newBalance } : a));
      }
    }
    showToast('Transaction deleted');
  };

  // ── Delete Account ────────────────────────────────────────
  const deleteAccount = async (accountId) => {
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) { showToast('Error deleting account'); return; }
    setAccounts(prev => prev.filter(a => a.id !== accountId));
    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
    showToast('Account deleted');
  };

  // ── Splits — now saved to Supabase ───────────────────────
  const addSplitExpense = async (splitData) => {
    if (!session) return;
    // SplitExpensePage uses "totalAmount" — support both field names
    const amount = parseFloat(splitData.totalAmount ?? splitData.amount) || 0;
    const row = {
      id: splitData.id || generateId(),
      user_id: session.user.id,
      amount,
      category: splitData.category || 'other',
      description: splitData.description || '',
      date: splitData.date || getToday(),
      splitMethod: splitData.splitMethod || 'equal',
      participants: JSON.stringify(splitData.participants || []),
      settledWith: JSON.stringify(splitData.settledWith || []),
    };
    const { error } = await supabase.from('splits').insert([row]);
    if (error) { console.error('addSplit error:', error.message); showToast('Error saving split'); return; }
    // Keep local object with both field names so SplitDetailPage works
    setSplits(prev => [toSplit({ ...row, totalAmount: amount }), ...prev]);
  };

  const updateSplitExpense = async (updatedSplit) => {
    if (!session) return;
    const { error } = await supabase.from('splits').update({
      settledWith: JSON.stringify(updatedSplit.settledWith || []),
      participants: JSON.stringify(updatedSplit.participants || []),
      description: updatedSplit.description || '',
      amount: parseFloat(updatedSplit.amount),
    }).eq('id', updatedSplit.id);
    if (error) { console.error('updateSplit error:', error.message); return; }
    setSplits(prev => prev.map(s => s.id === updatedSplit.id ? { ...s, ...updatedSplit } : s));
  };

  const deleteSplitExpense = async (splitId) => {
    if (!session) return;
    const { error } = await supabase.from('splits').delete().eq('id', splitId);
    if (error) { console.error('deleteSplit error:', error.message); return; }
    setSplits(prev => prev.filter(s => s.id !== splitId));
    setTransactions(prev => prev.filter(t => t.splitId !== splitId));
  };

  // ── Settings ──────────────────────────────────────────────
  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }));

  // ── Navigation ────────────────────────────────────────────
  const navigate = (page, data = null) => {
    const newPage = { page, data };

    setPageStack((prev) => [...prev, newPage]);

    // push to browser history (IMPORTANT)
    window.history.pushState(newPage, "", `#${page}`);
  };
  const goBack = () => {
    window.history.back(); // triggers popstate
  };
  const handleLogout = async () => await supabase.auth.signOut();

  // ── Context ───────────────────────────────────────────────
  const ctx = {
    user, accounts, transactions, splits, settings, currencySymbol,
    addAccount, addTransaction, deleteTransaction, deleteAccount,
    addSplitExpense, updateSplitExpense, deleteSplitExpense,
    updateSettings, navigate, goBack, showToast, setTab,
  };
  // ✅ Loading first
  if (!authReady) return <LoadingScreen />;

  // ✅ 1. Forgot Password (VERY IMPORTANT)
  if (currentPage?.page === "forgotPassword") {
    return <ForgotPassword />;
  }

  // ✅ 2. Reset Password (email link)
  if (window.location.pathname === "/reset-password") {
    return <ResetPassword />;
  }

  // ✅ 3. Normal auth
  if (!session) return <LoginPage />;

  const renderSubPage = () => {
    if (!currentPage) return null;
    switch (currentPage.page) {
      case 'addAccount': return <AddAccountPage ctx={ctx} />;
      case 'accountDetail': return <AccountDetailPage ctx={ctx} account={currentPage.data} />;
      case 'addExpense': return <AddExpensePage ctx={ctx} account={currentPage.data} />;
      case 'addIncome': return <AddIncomePage ctx={ctx} account={currentPage.data} />;
      case 'splitExpense': return <SplitExpensePage ctx={ctx} account={currentPage.data} />;
      case 'splitDetail': return <SplitDetailPage ctx={ctx} split={currentPage.data} />;
      case 'forgotPassword':
        return <ForgotPassword />;
      default: return null;
    }
  };

  const renderTab = () => {
    switch (tab) {
      case 'home': return <HomePage ctx={ctx} />;
      case 'accounts': return <AccountsPage ctx={ctx} />;
      case 'budget': return <BudgetPage ctx={ctx} />;
      case 'groups': return <SplitsPage ctx={ctx} />;
      case 'insights': return <InsightsPage ctx={ctx} />;
      case 'settings': return <SettingsPage ctx={ctx} onLogout={handleLogout} />;
      case 'transactions': return <TransactionsPage ctx={ctx} />;
      default: return <HomePage ctx={ctx} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {currentPage ? (
        <div className="page fade-slide">{renderSubPage()}</div>
      ) : (
        <>
          <div className="page fade-slide">{renderTab()}</div>
          <BottomNav
            active={tab}
            onChange={t => {
              setTab(t);
              setPageStack([]); // ✅ reset navigation stack
            }}
          />
        </>
      )}
      <Toast message={toast} />
    </div>
  );
}

export default App;