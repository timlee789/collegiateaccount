'use client'; // Client component for year/month selection

// ⚠️ 수정: React import 추가
import React, { useState, useEffect, useMemo } from 'react';
import { getAccountingData } from '../actions/accounting'; // ⚠️ 수정: getFinancialSummary 제거 (클라이언트에서 계산)
import CategoryReportTable from '../dashboard/MonthlyChart'; // Assuming CategoryReportTable is default export
import ProtectedPage from '../components/ProtectedPage';

/**
 * USD 통화 형식 헬퍼 함수
 */
function formatAsUSD(value) {
    const numericValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(numericValue)) {
        return '$0.00'; // 숫자가 아니면 $0.00 반환
    }
    // 아주 작은 값(예: 0.001)도 $0.00으로 표시되도록 반올림 고려
    if (Math.abs(numericValue) < 0.005) {
        return '$0.00';
    }
    return `$${numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

// --- ⬇️ "연도별 카테고리 월별 지출" 컴포넌트 추가 ⬇️ ---
function MonthlyCategoryBreakdown({ monthlyBreakdownData, selectedYear }) {
  if (!monthlyBreakdownData || Object.keys(monthlyBreakdownData).length === 0) {
    return null; // 데이터 없으면 표시 안 함
  }

  // 최신 월 순서대로 정렬된 월 목록 가져오기 & 선택된 연도로 필터링
  const sortedMonths = Object.keys(monthlyBreakdownData)
                         .filter(month => month.startsWith(selectedYear + '-')) // 선택된 연도 필터링
                         .sort((a, b) => b.localeCompare(a)); // 최신 월 순서

  // 필터링된 월 데이터가 없으면 표시 안 함
  if (sortedMonths.length === 0) {
      return <div className="text-center text-gray-400 py-4 col-span-1 md:col-span-3 lg:col-span-6">선택된 연도({selectedYear})에 데이터가 없습니다.</div>;
  }

  return (
    <div className="mb-8"> {/* 전체 섹션 아래 마진 */}
      <h2 className="text-2xl font-semibold mb-4 text-white">연도별 카테고리 월별 지출 ({selectedYear})</h2>
      {/* 각 월별로 테이블 생성 (md:3개, lg:6개) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedMonths.map(month => {
          const categories = monthlyBreakdownData[month].categories;
          const monthTotal = monthlyBreakdownData[month].total;

          if (!categories || categories.length === 0 || monthTotal === 0) {
            return null;
          }
          return (
            <div key={month} className="bg-gray-800 shadow-md rounded-lg border border-gray-700 overflow-hidden text-sm">
              <h3 className="px-3 py-2 bg-gray-700 font-semibold text-gray-200">{month}</h3>
              <table className="w-full">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-1 py-1 text-left text-xs font-medium text-gray-300 uppercase tracking-wider max-w-[80px] truncate">카테고리</th>
                    <th className="px-1 py-1 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">비용</th>
                    <th className="px-1 py-1 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {categories.map(({ category, amount, percentage }) => (
                    <tr key={category} className="hover:bg-gray-700">
                      <td className="px-1 py-1 text-gray-200 max-w-[80px] break-words">{category}</td>
                      <td className="px-1 py-1 whitespace-nowrap text-right text-red-400">{formatAsUSD(amount)}</td>
                      <td className="px-1 py-1 text-right text-gray-200">{percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                 <tfoot className="bg-gray-700 border-t-2 border-gray-600">
                    <tr>
                         <td className="px-1 py-1 font-bold text-gray-300 text-right">월 합계</td>
                         <td className="px-1 py-1 font-bold text-red-300 text-right">{formatAsUSD(monthTotal)}</td>
                         <td className="px-1 py-1 font-bold text-gray-300 text-right">100.0%</td>
                    </tr>
                 </tfoot>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// --- ⬆️ "연도별 카테고리 월별 지출" 컴포넌트 추가 ⬆️ ---


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

      // ⚠️ 수정: 데이터 처리 로직 추가 (report-detail과 동일하게)
      const validTransactions = data.map(t => {
          const dateObj = new Date(t.Date);
          if (dateObj instanceof Date && !isNaN(dateObj)) {
              return {
                  ...t,
                  _dateObj: dateObj,
                  _monthKey: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`,
                  _year: dateObj.getFullYear().toString()
              };
          }
          return null;
      }).filter(Boolean);

      setTransactions(validTransactions); // 유효한 데이터만 저장

      // Extract unique years from data
      const years = [...new Set(validTransactions
        .map(t => t._year) // _year 사용
        .filter(Boolean)
      )].sort((a, b) => b.localeCompare(a)); // 문자열로 정렬

      setAvailableYears(years);

      // Set default year to the latest one
      if (years.length > 0) {
        setSelectedYear(years[0]);
      } else {
        setSelectedYear(new Date().getFullYear().toString());
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // --- ⬇️ "모든 월별 카테고리 분석" 로직 추가 ⬇️ ---
  const allMonthsBreakdown = useMemo(() => {
      if (transactions.length === 0) {
          return {}; // { "YYYY-MM": { categories: [], total: 0 }, ... }
      }
      const monthlyData = {};
      transactions.forEach(t => {
          if (t.Div !== 'Expense' || !t._monthKey) return;
          const monthKey = t._monthKey;
          const category = t.Category || '기타';
          const amount = parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0;
          if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { categoriesMap: {}, total: 0 };
          }
          if (!monthlyData[monthKey].categoriesMap[category]) {
              monthlyData[monthKey].categoriesMap[category] = 0;
          }
          monthlyData[monthKey].categoriesMap[category] += amount;
          monthlyData[monthKey].total += amount;
      });
      Object.keys(monthlyData).forEach(monthKey => {
          const monthInfo = monthlyData[monthKey];
          const monthTotal = monthInfo.total;
          monthlyData[monthKey].categories = Object.entries(monthInfo.categoriesMap)
              .map(([category, amount]) => ({
                  category,
                  amount,
                  percentage: monthTotal !== 0 ? (amount / monthTotal) * 100 : 0,
              }))
              .sort((a, b) => b.amount - a.amount);
          delete monthlyData[monthKey].categoriesMap;
      });
      return monthlyData;
  }, [transactions]);
  // --- ⬆️ "모든 월별 카테고리 분석" 로직 추가 ⬆️ ---

  // 2. Calculate summary based on selected year (기존 로직 유지)
  const yearSummary = useMemo(() => {
    if (!selectedYear || transactions.length === 0) {
      return { categorySummary: {}, monthlySummary: {}, totalSummary: {} }; // Return empty object if no data/year
    }

    // ⚠️ 수정: _year를 사용하도록 필터링 로직 변경
    const yearlyTransactions = transactions.filter(t => t._year === selectedYear);

    // --- Re-implement getFinancialSummary logic client-side for the filtered data ---
    // ⚠️ 수정: _monthKey, Div, Category, Amount 사용
    const mapped = yearlyTransactions.map(t => ({
        yearMonth: t._monthKey,
        div: t.Div,
        category: t.Category,
        amount: parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0
    }));

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
              onChange={(e) => setSelectedYear(e.g.value)}
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
        </div>

        {/* --- ⬇️ "연도별 카테고리 월별 지출" 섹션 추가 ⬇️ --- */}
        {isLoading ? (
            <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
        ) : (
            <MonthlyCategoryBreakdown
                monthlyBreakdownData={allMonthsBreakdown}
                selectedYear={selectedYear} 
            />
        )}
        {/* --- ⬆️ "연도별 카테고리 월별 지출" 섹션 추가 ⬆️ --- */}


        {/* Category Report Table (기존) */}
        <div className="bg-gray-800 p-6 shadow-xl rounded-lg border border-gray-700 mt-8"> {/* mt-8 간격 추가 */}
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
