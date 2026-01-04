
import { Category, PaymentMethod } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', icon: '🍔', color: 'bg-orange-500' },
  { id: '2', name: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { id: '3', name: 'Transport', icon: '🚗', color: 'bg-blue-500' },
  { id: '4', name: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
  { id: '5', name: 'Health', icon: '🏥', color: 'bg-red-500' },
  { id: '6', name: 'Groceries', icon: '🛒', color: 'bg-emerald-500' },
  { id: '7', name: 'Bills & Utilities', icon: '💡', color: 'bg-yellow-500' },
  { id: '8', name: 'Salary', icon: '💰', color: 'bg-green-600' },
  { id: '9', name: 'Investments', icon: '📈', color: 'bg-indigo-600' },
  { id: '10', name: 'Others', icon: '📦', color: 'bg-slate-500' },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'p1', name: 'Cash', icon: '💵' },
  { id: 'p2', name: 'Credit Card', icon: '💳' },
  { id: 'p3', name: 'Bank Account', icon: '🏦' },
  { id: 'p4', name: 'Digital Wallet', icon: '📱' },
];

export const INITIAL_TRANSACTIONS = [
  { id: 't1', amount: 3500, type: 'income' as const, categoryId: '8', paymentMethodId: 'p3', date: new Date().toISOString(), note: 'Monthly Salary' },
  { id: 't2', amount: 45, type: 'expense' as const, categoryId: '1', paymentMethodId: 'p2', date: new Date().toISOString(), note: 'Dinner out' },
  { id: 't3', amount: 120, type: 'expense' as const, categoryId: '3', paymentMethodId: 'p1', date: new Date().toISOString(), note: 'Gas fill up' },
];
