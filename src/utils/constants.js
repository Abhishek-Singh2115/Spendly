export const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍔', color: '#f59e0b' },
  { id: 'transport', label: 'Transport', emoji: '🚗', color: '#6366f1' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#10b981' },
  { id: 'bills', label: 'Bills', emoji: '💡', color: '#06b6d4' },
  { id: 'entertain', label: 'Fun', emoji: '🎬', color: '#8b5cf6' },
  { id: 'education', label: 'Education', emoji: '📚', color: '#f43f5e' },
  { id: 'travel', label: 'Travel', emoji: '✈️', color: '#84cc16' },
  { id: 'salary', label: 'Salary', emoji: '💼', color: '#10b981' },
  { id: 'other', label: 'Other', emoji: '📦', color: '#94a3b8' },
];

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const NAV_ITEMS = [
  {id:'home',   icon:'home',    label:'Home'},
  {id:'accounts',icon:'wallet', label:'Accounts'},
  {id:'budget', icon:'budget',  label:'Budget'},
  {id:'groups', icon:'users',  label:'Splits'}, // Changed label
  {id:'insights',icon:'brain',  label:'Insights'},
  {id:'settings',icon:'settings',label:'Settings'},
];
// Add this to the existing constants

export const SPLIT_METHODS = [
  { id: 'equal', label: 'Split Equally', icon: '⚖️', desc: 'Divide bill equally among all' },
  { id: 'exact', label: 'Exact Amounts', icon: '🎯', desc: 'Enter specific amounts for each person' },
  { id: 'percentage', label: 'By Percentage', icon: '📊', desc: 'Split by percentage shares' },
  { id: 'shares', label: 'By Shares', icon: '🍕', desc: 'Split by number of shares' },
];

// Update NAV_ITEMS
// export const NAV_ITEMS = [
//   {id:'home',   icon:'home',    label:'Home'},
//   {id:'accounts',icon:'wallet', label:'Accounts'},
//   {id:'budget', icon:'budget',  label:'Budget'},
//   {id:'groups', icon:'users',  label:'Splits'}, // Changed label
//   {id:'insights',icon:'brain',  label:'Insights'},
//   {id:'settings',icon:'settings',label:'Settings'},
// ];