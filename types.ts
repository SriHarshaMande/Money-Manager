
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethodId: string;
  date: string; // ISO String including date and time
  note: string;
  images?: string[]; // Array of base64 image strings
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
