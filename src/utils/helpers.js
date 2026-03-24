import { CATEGORIES } from './constants';

export const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const generateId = () => {
  return Math.random().toString(36).slice(2, 10);
};

export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export const getCategory = (id) => {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other');
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};