
import { Transaction, Category, PaymentMethod, TransactionType } from '../types';

const ICON_MAP: Record<string, string> = {
  food: '🍔',
  dining: '🍔',
  restaurant: '🍔',
  tea: '☕',
  drink: '☕',
  ice: '🍦',
  transport: '🚗',
  transportation: '🚗',
  bike: '🚲',
  car: '🚗',
  auto: '🛺',
  rapido: '🏍️',
  ola: '🚕',
  uber: '🚕',
  fuel: '⛽',
  petrol: '⛽',
  repair: '🛠️',
  shopping: '🛍️',
  clothes: '👕',
  kirana: '🛒',
  grocery: '🛒',
  groceries: '🛒',
  household: '🏠',
  home: '🏠',
  electricity: '💡',
  bill: '🧾',
  utilities: '💡',
  mobile: '📱',
  recharge: '⚡',
  internet: '🌐',
  entertainment: '🎬',
  movie: '🍿',
  salary: '💰',
  income: '📈',
  health: '🏥',
  medical: '💊',
  medicine: '💊',
  investment: '🏦',
  gift: '🎁',
  travel: '✈️',
  hotel: '🏨',
};

const getBestIcon = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
};

export const parseLegacyData = (
  text: string,
  categories: Category[],
  paymentMethods: PaymentMethod[]
): { 
  transactions: Transaction[], 
  categories: Category[], 
  paymentMethods: PaymentMethod[] 
} => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const transactions: Transaction[] = [];
  const currentCategories = Array.isArray(categories) ? [...categories] : [];
  const currentPaymentMethods = Array.isArray(paymentMethods) ? [...paymentMethods] : [];

  const headerKeywords = ['date', 'account', 'category', 'amount', 'inr'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const columns = line.split('\t');
      const firstColLower = (columns[0] || '').toLowerCase();
      
      // Skip headers
      if (headerKeywords.some(k => firstColLower.includes(k))) continue;

      // Minimum columns check for safety
      if (columns.length < 6) continue;

      const rawDate = columns[0] || '';
      const rawAccount = columns[1] || 'Unknown';
      const rawCategory = columns[2] || ''; // Let it be empty if missing
      const rawNote = columns[4] || '';
      const rawAmountStr = columns[5] || '0';
      const rawType = columns[6] || 'Expense';
      const rawDesc = columns[7] || '';

      const cleanAmount = String(rawAmountStr).replace(/[^\d.-]/g, '');
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount)) continue;

      let parsedDate: Date;
      if (rawDate.includes('-')) {
        const parts = rawDate.split(' ')[0].split('-');
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const y = parseInt(parts[2], 10);
          parsedDate = new Date(y, m - 1, d);
        } else {
          parsedDate = new Date(rawDate);
        }
      } else {
        parsedDate = new Date(rawDate);
      }
      
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      let type: TransactionType = 'expense';
      const typeLower = rawType.toLowerCase();
      if (typeLower.includes('income')) {
        type = 'income';
      } else if (typeLower.includes('transfer') || typeLower.includes('lent')) {
        // Treat all 'Transfer', 'Transfer-out', and 'Lent' as 'lent' type per instructions
        type = 'lent';
      }

      // Determine final category name for matching/creation
      const finalCategoryName = rawCategory.trim() || 'Others';

      // Smarter Category Matching
      let category = currentCategories.find(c => {
        const cName = c.name.toLowerCase();
        const rName = finalCategoryName.toLowerCase();
        return cName === rName || 
               (cName === 'transport' && rName === 'transportation') ||
               (cName === 'transportation' && rName === 'transport') ||
               (cName === 'bills & utilities' && (rName.includes('bill') || rName.includes('recharge'))) ||
               (cName === 'food & dining' && rName === 'food');
      });

      // Create category if unknown
      if (!category) {
        category = {
          id: `cat_${Math.random().toString(36).substr(2, 5)}_${Date.now()}`,
          name: finalCategoryName,
          icon: getBestIcon(finalCategoryName),
          color: 'bg-slate-500',
          type: type === 'income' ? 'income' : 'expense',
          isCustom: true
        };
        currentCategories.push(category);
      }

      // Match or Create Payment Method
      let pm = currentPaymentMethods.find(p => p.name.toLowerCase() === rawAccount.toLowerCase());
      if (!pm) {
        pm = {
          id: `pm_${Math.random().toString(36).substr(2, 5)}_${Date.now()}`,
          name: rawAccount,
          icon: '💳'
        };
        currentPaymentMethods.push(pm);
      }

      transactions.push({
        id: `imp_${Math.random().toString(36).substr(2, 9)}_${i}`,
        amount: Math.abs(amount),
        type,
        // Lent and Transfer types do not use standard expense categories in the current UI
        // Fix: Removed 'type === 'transfer'' because 'type' is narrowed to 'income'|'expense'|'lent' 
        // by the logic on line 105. Transfers are internally treated as 'lent'.
        categoryId: type === 'lent' ? undefined : category.id,
        paymentMethodId: pm.id,
        date: parsedDate.toISOString(),
        note: rawNote || rawDesc || category.name,
        images: []
      });
    } catch (lineError) {
      console.warn(`Error parsing line ${i}:`, lineError);
      continue;
    }
  }

  return {
    transactions,
    categories: currentCategories,
    paymentMethods: currentPaymentMethods
  };
};
