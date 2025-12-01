import React from 'react';
import { Expense, ExpenseType } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
      <h3 className="text-gray-700 font-bold mb-4 border-l-4 border-gray-400 pl-2">最近记录</h3>
      <div className="overflow-y-auto max-h-96 pr-2 no-scrollbar">
        {expenses.length === 0 ? (
           <p className="text-gray-400 text-center py-4">暂无记录</p>
        ) : (
          <ul className="space-y-3">
            {[...expenses].reverse().map((expense) => (
              <li key={expense.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group border-b border-gray-50 last:border-0 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full ${expense.type === ExpenseType.NEED ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{expense.description}</p>
                    <div className="text-xs text-gray-500 flex gap-2">
                       <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{expense.category}</span>
                       <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-800">-¥{expense.amount.toFixed(2)}</p>
                    <p className={`text-xs ${expense.type === ExpenseType.NEED ? 'text-emerald-600' : 'text-red-500'}`}>
                        {expense.type === ExpenseType.NEED ? '刚需' : '想要'}
                    </p>
                  </div>
                  <button 
                    onClick={() => onDelete(expense.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print"
                    title="删除"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;