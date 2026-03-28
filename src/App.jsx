import { supabase } from './supabase';
import { useState, useEffect } from 'react';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SplitsPage } from './pages/SplitsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
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

function App() {
  const [user, setUser] = useLocalStorage('sp_user', null);
  const [accounts, setAccounts] = useLocalStorage('sp_accounts', []);
  const [transactions, setTransactions] = useLocalStorage('sp_txns', []);
  const [splits, setSplits] = useLocalStorage('sp_splits', []);
  const [settings, setSettings] = useLocalStorage('sp_settings', {
    theme: 'dark',
    currency: 'INR'
  });

  const [tab, setTab] = useState('home');
  const [subPage, setSubPage] = useState(null);
  const { message: toast, showToast } = useToast();

  // ✅ Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setTransactions(
          data
            .map(txn => ({
              ...txn,
              date: txn.created_at || txn.date
            }))
            .filter(txn => txn.accountId) // ✅ IMPORTANT FIX
        );
      }
    };

    fetchTransactions();
  }, []);

  // ✅ Theme
  useEffect(() => {
    document.documentElement.classList.toggle(
      'light-mode',
      settings.theme === 'light'
    );
  }, [settings.theme]);

  const currencySymbol =
    CURRENCIES.find(c => c.code === settings.currency)?.symbol || '₹';

  // ✅ Add Account
  const addAccount = (accountData) => {
    const newAccount = {
      ...accountData,
      id: generateId(),
      balance: parseFloat(accountData.startBalance) || 0
    };

    setAccounts(prev => [...prev, newAccount]);

    if (parseFloat(accountData.startBalance) > 0) {
      addTransaction({
        accountId: newAccount.id,
        amount: parseFloat(accountData.startBalance),
        type: 'income',
        category: 'other',
        description: 'Opening Balance',
        date: getToday()
      });
    }

    return newAccount;
  };

  // ✅ Add Transaction
  const addTransaction = async (txn) => {
    const transaction = { ...txn, id: txn.id || generateId() };

    try {
      await supabase.from('transactions').insert([
        {
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: transaction.date,
          accountId: transaction.accountId || null
        }
      ]);

      setTransactions(prev => [transaction, ...prev]);

      if (transaction.type === 'expense') {
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === transaction.accountId
              ? { ...acc, balance: acc.balance - transaction.amount }
              : acc
          )
        );
      } else {
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === transaction.accountId
              ? { ...acc, balance: acc.balance + transaction.amount }
              : acc
          )
        );
      }

    } catch (err) {
      console.error("Insert error:", err);
    }
  };

  // ✅ Delete Transaction
  const deleteTransaction = (txnId) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    setTransactions(prev => prev.filter(t => t.id !== txnId));

    if (txn.type === 'expense') {
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === txn.accountId
            ? { ...acc, balance: acc.balance + txn.amount }
            : acc
        )
      );
    } else {
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === txn.accountId
            ? { ...acc, balance: acc.balance - txn.amount }
            : acc
        )
      );
    }

    showToast('Transaction deleted');
  };

  // ✅ Delete Account
  const deleteAccount = async (accountId) => {
    try {
      await supabase
        .from('transactions')
        .delete()
        .eq('accountId', accountId);

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setTransactions(prev =>
        prev.filter(txn => txn.accountId !== accountId)
      );

      showToast('Account deleted');

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ✅ Splits
  const addSplitExpense = (split) => {
    setSplits(prev => [split, ...prev]);
  };

  const updateSplitExpense = (updatedSplit) => {
    setSplits(prev =>
      prev.map(s => (s.id === updatedSplit.id ? updatedSplit : s))
    );
  };

  const deleteSplitExpense = (splitId) => {
    setSplits(prev => prev.filter(s => s.id !== splitId));
    setTransactions(prev => prev.filter(t => t.splitId !== splitId));
  };

  // ✅ Settings
  const updateSettings = (patch) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  // ✅ Navigation
  const navigate = (page, data = null) => {
    setSubPage({ page, data });
  };

  const goBack = () => setSubPage(null);

  // ✅ Context
  const ctx = {
    user,
    accounts,
    transactions,
    splits,
    settings,
    currencySymbol,
    addAccount,
    addTransaction,
    deleteTransaction,
    deleteAccount,
    addSplitExpense,
    updateSplitExpense,
    deleteSplitExpense,
    updateSettings,
    navigate,
    goBack,
    showToast,
    setTab
  };
  if (!user) {
    return (
      <LoginPage
        onLogin={(u) => {
          setUser(u);        // login user
          setTab('home');    // ✅ go to home page
          setSubPage(null);  // ✅ clear any old page
        }}
      />
    );
  }

  const renderSubPage = () => {
    if (!subPage) return null;

    switch (subPage.page) {
      case 'addAccount':
        return <AddAccountPage ctx={ctx} />;
      case 'accountDetail':
        return <AccountDetailPage ctx={ctx} account={subPage.data} />;
      case 'addExpense':
        return <AddExpensePage ctx={ctx} account={subPage.data} />;
      case 'addIncome':
        return <AddIncomePage ctx={ctx} account={subPage.data} />;
      case 'splitExpense':
        return <SplitExpensePage ctx={ctx} account={subPage.data} />;
      case 'splitDetail':
        return <SplitDetailPage ctx={ctx} split={subPage.data} />;
      default:
        return null;
    }
  };

  const renderTab = () => {
    switch (tab) {
      case 'home':
        return <HomePage ctx={ctx} />;
      case 'accounts':
        return <AccountsPage ctx={ctx} />;
      case 'budget':
        return <BudgetPage ctx={ctx} />;
      case 'groups':
        return <SplitsPage ctx={ctx} />;
      case 'insights':
        return <InsightsPage ctx={ctx} />;
      case 'settings':
        return <SettingsPage ctx={ctx} onLogout={() => setUser(null)} />;
      default:
        return <HomePage ctx={ctx} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {subPage ? (
        <div className="page fade-slide">{renderSubPage()}</div>
      ) : (
        <>
          <div className="page fade-slide">{renderTab()}</div>
          <BottomNav
            active={tab}
            onChange={(t) => {
              setTab(t);
              setSubPage(null);
            }}
          />
        </>
      )}
      <Toast message={toast} />
    </div>
  );
}

export default App;