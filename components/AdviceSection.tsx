import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Expense } from '../types';
import { generateFinancialAdvice } from '../services/geminiService';

interface AdviceSectionProps {
  expenses: Expense[];
}

const AdviceSection: React.FC<AdviceSectionProps> = ({ expenses }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    const report = await generateFinancialAdvice(expenses);
    setAdvice(report);
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-brain text-purple-500"></i> AI 智囊团
        </h2>
        <button
          onClick={handleGenerateAdvice}
          disabled={loading || expenses.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 no-print ${
            loading || expenses.length === 0
              ? 'bg-gray-100 text-gray-400'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
          生成理财建议
        </button>
      </div>

      {advice ? (
        <div className="prose prose-purple prose-sm max-w-none bg-purple-50 p-6 rounded-xl border border-purple-100">
          <ReactMarkdown>{advice}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <i className="fas fa-lightbulb text-4xl mb-3 text-gray-300"></i>
          <p>点击上方按钮，让 AI 分析您的消费习惯并提供建议。</p>
        </div>
      )}
    </div>
  );
};

export default AdviceSection;