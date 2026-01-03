
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly';
}

export interface FinancialInsight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
}

export interface ReceiptScanResult {
  merchant?: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
}
