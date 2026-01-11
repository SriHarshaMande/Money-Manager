
import React from 'react';
import { FinancialInsight } from '../types';

interface InsightsProps {
  insights: FinancialInsight[];
  loading: boolean;
  onRefresh: () => void;
}

const Insights: React.FC<InsightsProps> = ({ insights, loading, onRefresh }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 dark:text-zinc-100">
          <span className="text-xl">✨</span> AI Insights
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
            <div className="h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
            <div className="h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full"></div>
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${
                insight.severity === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                  : insight.severity === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20'
              }`}
            >
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 mb-1">{insight.title}</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{insight.description}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-400 dark:text-zinc-600 text-center py-4 text-sm italic">No insights available yet. Add more transactions!</p>
        )}
      </div>
    </div>
  );
};

export default Insights;
