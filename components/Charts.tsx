import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Expense, ExpenseType } from '../types';

interface ChartsProps {
  expenses: Expense[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
const TYPE_COLORS = { [ExpenseType.NEED]: '#10B981', [ExpenseType.WANT]: '#EF4444' };

const Charts: React.FC<ChartsProps> = ({ expenses }) => {
  if (expenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex items-center justify-center h-64 text-gray-400">
        暂无数据，快去记一笔吧！
      </div>
    );
  }

  // Process data for Categories
  const categoryDataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: categoryDataMap[key]
  }));

  // Process data for Need vs Want
  const typeDataMap = expenses.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.keys(typeDataMap).map(key => ({
    name: key === ExpenseType.NEED ? '刚需 (Need)' : '想要 (Want)',
    value: typeDataMap[key],
    originalKey: key
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Category Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center">
        <h3 className="text-gray-700 font-bold mb-4 w-full text-left border-l-4 border-secondary pl-2">支出类别分布</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={false} // Important for PDF export
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Need vs Want Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center">
        <h3 className="text-gray-700 font-bold mb-4 w-full text-left border-l-4 border-primary pl-2">消费性质分析 (Need vs Want)</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={80}
                dataKey="value"
                isAnimationActive={false} // Important for PDF export
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-type-${index}`} fill={TYPE_COLORS[entry.originalKey as ExpenseType]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;