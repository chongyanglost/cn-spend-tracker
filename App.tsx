import React, { useState, useEffect } from 'react';
import ExpenseInput from './components/ExpenseInput';
import Charts from './components/Charts';
import AdviceSection from './components/AdviceSection';
import ExpenseList from './components/ExpenseList';
import { Expense } from './types';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('smart_finance_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('smart_finance_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      {/* Print Only Header - Visible only in PDF */}
      <div className="print-only text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900">个人财务分析报告</h1>
        <p className="text-gray-500 mt-2">生成日期: {new Date().toLocaleDateString()} | 智理财 AI 助手</p>
        <hr className="my-6 border-gray-300"/>
      </div>

      {/* Header - Hidden in Print */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-6 shadow-lg sticky top-0 z-10 no-print">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight"><i className="fas fa-wallet mr-2"></i>智理财</h1>
            <p className="text-emerald-100 text-sm opacity-90">基于 Gemini 的 AI 记账顾问</p>
          </div>
          <div className="text-right">
             <p className="text-xs text-emerald-100 uppercase tracking-wide">本月支出</p>
             <p className="text-2xl font-bold">¥ {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 mt-4">
        
        {/* Input Section - Hidden when printing */}
        <div className="no-print">
            <ExpenseInput 
              onAddExpense={addExpense} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
            />
        </div>

        {/* Charts & Data */}
        <Charts expenses={expenses} />
        
        {/* Recent List */}
        <ExpenseList expenses={expenses} onDelete={deleteExpense} />

        {/* AI Advice */}
        <AdviceSection expenses={expenses} />

      </main>

        <footer className="text-center text-gray-400 text-sm py-6 no-print">
            <p>Powered by Google Gemini 2.5 Flash</p>
        </footer>
    </div>
  );
};

export default App;