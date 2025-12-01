export enum ExpenseType {
  NEED = 'Need',
  WANT = 'Want',
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: ExpenseType;
  date: string; // ISO Date string
}

export interface FinancialAdvice {
  markdownReport: string;
  savingsPotential: number;
}
