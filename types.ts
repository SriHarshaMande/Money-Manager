
// Added 'transfer' to TransactionType to support legacy data imports and resolve type mismatch errors in importService.ts
export type TransactionType = 'income' | 'expense' | 'lent' | 'transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
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
  categoryId?: string; 
  paymentMethodId: string; 
  date: string; 
  note: string;
  images?: string[]; 
  // Fields for Lent transactions
  isReturned?: boolean;
  returnedDate?: string;
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
