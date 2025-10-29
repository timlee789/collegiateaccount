'use client'; // Client component for year/month selection

import { useState, useEffect, useMemo } from 'react';
import { getAccountingData, getFinancialSummary } from '../actions/accounting'; // Use getFinancialSummary logic client-side
import CategoryReportTable from '../dashboard/MonthlyChart'; // Assuming CategoryReportTable is default export
import ProtectedPage from '../components/ProtectedPage';
/**
 * USD 통화 형식 헬퍼 함수
 */
function formatAsUSD(value) {
    const numericValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(numericValue)) {
        return '$0.00';
    }
    return `$${numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * 월별 요약 보고서 페이지 (연도 선택 추가)
 */
export default function ReportPage() {
  const [transactions, setTransactions] = useState([]); // Store all transactions
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Load all accounting data on initial render
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { data, error: dataError } = await getAccountingData(); // Fetch all data

      if (dataError) {
        setError(dataError);
        setIsLoading(false);
        return;
      }
      setTransactions(data);

      // Extract unique years from data
      const years = [...new Set(data
        .map(t => {
            const dateObj = new Date(t.Date);
            return dateObj instanceof Date && !isNaN(dateObj) ? dateObj.getFullYear() : null;
        })
        .filter(Boolean)
      )].sort((a, b) => b - a);

      setAvailableYears(years);

      // Set default year to the latest one
      if (years.length > 0) {
        setSelectedYear(years[0].toString());
      } else {
        setSelectedYear(new Date().getFullYear().toString());
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // 2. Calculate summary based on selected year
  const yearSummary = useMemo(() => {
    if (!selectedYear || transactions.length === 0) {
      return { categorySummary: {}, monthlySummary: {}, totalSummary: {} }; // Return empty object if no data/year
    }

    // Filter transactions for the selected year
    const yearlyTransactions = transactions.filter(t => {
        const dateObj = new Date(t.Date);
        return dateObj instanceof Date && !isNaN(dateObj) && dateObj.getFullYear().toString() === selectedYear;
    });

    // --- Re-implement getFinancialSummary logic client-side for the filtered data ---
    const mapped = yearlyTransactions.map(t => {
        const dateString = t.Date;
        const div = t.Div;
        const category = t.Category;
        const amountStr = String(t.Amount).replace(/[^0-9.-]+/g, '');
        const amount = parseFloat(amountStr) || 0;
        const transaction = { date: dateString, div, category, amount };
        const dateObj = new Date(dateString);
        if (dateString && !isNaN(dateObj)) {
            transaction.yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        } else {
             transaction.yearMonth = 'Invalid Date';
        }
        return transaction;
    }).filter(t => t.yearMonth !== 'Invalid Date');

    // Monthly summary for the selected year
    const monthlySummary = mapped.reduce((acc, t) => {
        const month = t.yearMonth;
        if (!acc[month]) acc[month] = { revenue: 0, expense: 0, net: 0 };
        if (t.div === 'Income') acc[month].revenue += t.amount;
        else if (t.div === 'Expense') acc[month].expense += t.amount;
        acc[month].net = acc[month].revenue - acc[month].expense;
        return acc;
    }, {});

    // Category summary for the selected year
    const categorySummary = {};
    mapped.forEach(t => {
        if (t.div === 'Expense') {
            const month = t.yearMonth;
            const category = t.category || '기타';
            if (!categorySummary[month]) categorySummary[month] = {};
            categorySummary[month][category] = (categorySummary[month][category] || 0) + t.amount;
        }
    });

     // Total summary for the selected year
    const totalSummary = {
        totalRevenue: mapped.filter(t => t.div === 'Income').reduce((sum, t) => sum + t.amount, 0),
        totalExpense: mapped.filter(t => t.div === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    };
    totalSummary.netIncome = totalSummary.totalRevenue - totalSummary.totalExpense;
    // --- End of re-implemented logic ---

    return { categorySummary, monthlySummary, totalSummary };

  }, [transactions, selectedYear]);

  

  // Assuming dark background
  return (
    <>
    <ProtectedPage>
      <div className="p-8 mx-auto mt-10 text-white">
        <h1 className="text-4xl font-extrabold mb-8 text-white border-b border-gray-700 pb-4">월별 요약 보고서</h1>

        {/* Year Selection Dropdown */}
        <div className="mb-6 max-w-xs">
            <label htmlFor="year-select" className="block text-sm font-semibold text-white mb-1">
              연도 선택:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
        </div>

        {/* Category Report Table */}
        <div className="bg-gray-800 p-6 shadow-xl rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">월별 Category별 지출 합계 ({selectedYear})</h2>
             {/* Pass the calculated categorySummary for the selected year */}
            <CategoryReportTable data={yearSummary.categorySummary} />
        </div>

        {/* Optionally add Monthly Trend Chart or other summaries here */}

      </div>
      </ProtectedPage>
    </>
  );
}

