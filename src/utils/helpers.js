import { CATEGORIES } from './constants';

export const formatCurrency = (amount, symbol = '₹') => {
  const num = parseFloat(amount) || 0;
  return `${symbol}${Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Uses crypto.randomUUID → matches uuid column type in Supabase
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback (older browsers)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

export const getToday = () => new Date().toISOString().split('T')[0];

export const getCategory = (id) =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other');

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};