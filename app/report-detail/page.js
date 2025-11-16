'use client'; // 👈 상호작용(월 선택)을 위해 클라이언트 컴포넌트로 전환

import React, { useState, useEffect, useMemo } from 'react'; // Import React for Fragment key
import { getAccountingData } from '../actions/accounting';
import ProtectedPage from '../components/ProtectedPage';

/**
 * USD 통화 형식 헬퍼 함수
 */
function formatAsUSD(value) {
    // $ 기호나 쉼표가 포함된 문자열을 숫자로 변환
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


// --- ⬇️ 기존 컴포넌트 (선택된 월 카테고리 요약) ⬇️ ---
function CategorySummaryTable({ categorySummary, monthlyTotal }) {
  // ... (기존 CategorySummaryTable 코드 유지) ...
    if (!categorySummary || categorySummary.length === 0 || monthlyTotal === 0) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto overflow-x-auto bg-gray-800 shadow-md rounded-lg border border-gray-700 mb-6">
      <table className="w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">카테고리</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">합계 금액</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">비율 (%)</th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {categorySummary.map(({ category, total, percentage }) => (
            <tr key={category} className="hover:bg-gray-700">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{category}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-red-400">{formatAsUSD(total)}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-200">{percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// --- ⬆️ 기존 컴포넌트 (선택된 월 카테고리 요약) ⬆️ ---


/**
 * 월별 상세 경비 보고서 페이지
 */
export default function ReportDetailPage() {
  const [transactions, setTransactions] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]); // "YYYY-MM" 형식 저장
  const [selectedMonth, setSelectedMonth] = useState(''); // 선택된 "YYYY-MM" 형식 저장
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 페이지 로드 시 전체 거래 내역을 가져옵니다.
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { data, error: dataError } = await getAccountingData();

      if (dataError) {
        setError(dataError);
        setIsLoading(false);
        return;
      }

      // 날짜 유효성 검사 및 변환 추가 (초기 로드 시)
      const validTransactions = data.map(t => {
          const dateObj = new Date(t.Date);
          if (dateObj instanceof Date && !isNaN(dateObj)) {
              return {
                  ...t,
                  _dateObj: dateObj,
                  _monthKey: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`,
              };
          }
          return null;
      }).filter(Boolean);


      setTransactions(validTransactions);

      // "YYYY-MM" 형식 추출 및 정렬 (기존 월 선택용)
      const months = [...new Set(validTransactions.map(t => t._monthKey))]
                       .sort((a, b) => b.localeCompare(a));

      setAvailableMonths(months);

      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // 2. 선택된 월이 변경될 때마다 데이터를 필터링하고 그룹화하며 월별 총합계를 계산합니다. (기존 로직 유지)
  const { groupedData, monthlyTotal } = useMemo(() => {
     if (!selectedMonth || transactions.length === 0) {
      return { groupedData: {}, monthlyTotal: 0 };
     }
     const filtered = transactions.filter(t => t._monthKey === selectedMonth && t.Div === 'Expense');
     
     const grouped = filtered.reduce((acc, t) => {
      // ⚠️ 수정: t.Amount -> t.TOTAL
      const amount = parseFloat(String(t.TOTAL).replace(/[^0-9.-]+/g, '')) || 0;
      const category = t.Category || '기타';
      if (!acc[category]) {
        acc[category] = { transactions: [], total: 0 };
      }
      acc[category].transactions.push(t);
      acc[category].total += amount; // 카테고리별 합계
      return acc;
    }, {});
     
     // ⚠️ 수정: t.Amount -> t.TOTAL
     const total = filtered.reduce((sum, t) => sum + (parseFloat(String(t.TOTAL).replace(/[^0-9.-]+/g, '')) || 0), 0); // 월 총합계
     return { groupedData: grouped, monthlyTotal: total };
  }, [transactions, selectedMonth]);

  // 3. 카테고리별 요약 데이터 계산 (선택된 월 기준) (기존 로직 유지)
  const categorySummaryData = useMemo(() => {
     if (Object.keys(groupedData).length === 0) {
      return [];
    }
     return Object.entries(groupedData)
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: monthlyTotal !== 0 ? (data.total / monthlyTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [groupedData, monthlyTotal]);


  return (
    <>
      <ProtectedPage>
      <div className="p-8 mx-auto mt-10 text-white">
        <h1 className="text-4xl font-extrabold mb-8 text-white border-b border-gray-700 pb-4">월별 상세 경비 보고서</h1>

        {/* --- ⬇️ 선택된 월 보고서 섹션 (기존 유지) ⬇️ --- */}
        <h2 className="text-2xl font-semibold mb-4 text-white">{selectedMonth} 상세 보고서</h2>

        {/* 월 선택 및 월별 총합계 표시 */}
        <div className="flex items-end mb-6 space-x-4">
          <div className="max-w-xs">
            <label htmlFor="month-select" className="block text-sm font-semibold text-white mb-1">
              보고서 월 선택:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="pb-1">
              <span className="text-sm font-semibold text-white">Monthly Total: </span>
              <span className="text-lg font-bold text-red-400">{formatAsUSD(monthlyTotal)}</span>
DASHBOARD_PAGE_CODE: 279
          </div>
        </div>

        {/* 선택된 월 카테고리 요약 테이블 */}
        {isLoading ? (
             <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
        ) : (
             <CategorySummaryTable categorySummary={categorySummaryData} monthlyTotal={monthlyTotal} />
        )}

        {/* 선택된 월의 상세 내역 */}
        <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">{selectedMonth} 상세 내역</h2>
        <div className="space-y-6">
          {categorySummaryData.length > 0 ? (
              categorySummaryData.map(({ category }) => (
                <div key={category} className="bg-gray-800 p-6 shadow-xl rounded-lg border border-gray-700">
                  <h2 className="text-2xl font-semibold mb-4 text-indigo-400">{category}</h2>
                  <CategoryDetailTable transactions={groupedData[category].transactions} />
                </div>
              ))
          ) : (
              !isLoading && <div className="text-center text-gray-400">선택된 월에 지출 내역이 없습니다.</div>
          )}
        </div>
        {/* --- ⬆️ 선택된 월 보고서 섹션 (기존 유지) ⬆️ --- */}

      </div>
      </ProtectedPage>
    </>
  );
}

/**
 * 카테고리별 상세 내역을 표시하는 테이블 컴포넌트 (기존 유지)
 */
function CategoryDetailTable({ transactions }) {
    // ... (기존 CategoryDetailTable 코드 유지) ...
    // 1. Payee를 기준으로 transactions 그룹화
    const groupedByPayee = transactions.reduce((acc, t) => {
      const payee = t.Payees || '기타 Payee';
      if (!acc[payee]) {
        acc[payee] = [];
      }
      acc[payee].push(t);
      return acc;
    }, {});

    // Payee 이름으로 정렬
    const sortedPayees = Object.keys(groupedByPayee).sort();

    // 2. 전체 카테고리 총계 계산 (기존 로직)
    // ⚠️ 수정: categoryTotal도 t.TOTAL로 합산
    const categoryTotal = transactions.reduce((sum, t) => sum + (parseFloat(String(t.TOTAL).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const cashTotal = transactions.reduce((sum, t) => sum + (parseFloat(String(t.CASH).replace(/[^0-9.-]+/g, '')) || 0), 0);
    const totalTotal = transactions.reduce((sum, t) => sum + (parseFloat(String(t.TOTAL).replace(/[^0-9.-]+/g, '')) || 0), 0);

    return (
         <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-700">
                 <thead className="bg-gray-700">
                     <tr>
                         <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Payee</th>
                         <th className="px-4 py-2 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                         <th className="px-4 py-2 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">CASH</th>
                         <th className="px-4 py-2 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">TOTAL</th>
                         <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Date</th>
                         <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Concept</th>
                     </tr>
                 </thead>
                 <tbody className="bg-gray-800 divide-y divide-gray-700">
                     {/* Fragment에 key prop 추가 */}
                     {sortedPayees.map(payee => {
                         const payeeTransactions = groupedByPayee[payee];
                         // ⚠️ 수정: payeeSubtotalAmount도 t.TOTAL로 합산
                         const payeeSubtotalAmount = payeeTransactions.reduce((sum, t) => sum + (parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0), 0);
                         const payeeSubtotalCash = payeeTransactions.reduce((sum, t) => sum + (parseFloat(String(t.CASH).replace(/[^0-9.-]+/g, '')) || 0), 0);
                         const payeeSubtotalTotal = payeeTransactions.reduce((sum, t) => sum + (parseFloat(String(t.TOTAL).replace(/[^0-9.-]+/g, '')) || 0), 0);

                         return (
                             // 수정: Fragment에 고유한 key prop (payee 이름) 추가
                             <React.Fragment key={payee}>
                                 {payeeTransactions.map(t => (
                                     <tr key={t.__rowIndex} className="hover:bg-gray-700">
                                         <td className="px-4 py-2 text-sm text-gray-200 whitespace-nowrap">{t.Payees}</td>
                                         <td className="px-4 py-2 text-sm text-gray-200 text-right whitespace-nowrap">{formatAsUSD(t.Amount)}</td>
                                         <td className="px-4 py-2 text-sm text-gray-200 text-right whitespace-nowrap">{formatAsUSD(t.CASH)}</td>
                                         <td className="px-4 py-2 text-sm text-gray-200 text-right whitespace-nowrap">{formatAsUSD(t.TOTAL)}</td>
                                         <td className="px-4 py-2 text-sm text-gray-200 whitespace-nowrap">{t.Date}</td>
                                         <td className="px-4 py-2 text-sm text-gray-200">{t.Concept}</td>
                                     </tr>
                                 ))}
                                 {/* --- ⬇️ Subtotal 행 수정 ⬇️ --- */}
                                 <tr className="bg-gray-700 border-t border-gray-600">
                                     <td className="px-4 py-2 text-sm font-semibold text-gray-400 text-right italic">Subtotal for {payee}</td>
                                     <td className="px-4 py-2 text-sm font-semibold text-gray-200 text-right italic">{formatAsUSD(payeeSubtotalAmount)}</td>
                                     <td className="px-4 py-2 text-sm font-semibold text-gray-200 text-right italic">{formatAsUSD(payeeSubtotalCash)}</td>
                                     {/* TOTAL 소계 표시 추가 */}
                                     <td className="px-4 py-2 text-sm font-semibold text-gray-200 text-right italic">{formatAsUSD(payeeSubtotalTotal)}</td>
                                     {/* colSpan 수정 (3 -> 2) */}
                                     <td colSpan="2"></td>
                                 </tr>
                                 {/* --- ⬆️ Subtotal 행 수정 ⬇️ --- */}
                             </React.Fragment> // 수정: Fragment 닫기 (명시적으로 React.Fragment 사용)
                         );
                     })}
                 </tbody>
                 <tfoot className="bg-gray-700 border-t-2 border-gray-600">
                     <tr>
                         <td className="px-4 py-2 text-sm font-bold text-gray-200">Category Total</td>
                         {/* ⚠️ 수정: categoryTotal도 t.TOTAL로 합산 */}
                         <td className="px-4 py-2 text-sm font-bold text-gray-200 text-right">{formatAsUSD(categoryTotal)}</td>
                         <td className="px-4 py-2 text-sm font-bold text-gray-200 text-right">{formatAsUSD(cashTotal)}</td>
                         <td className="px-4 py-2 text-sm font-bold text-gray-200 text-right">{formatAsUSD(totalTotal)}</td>
                         <td colSpan="2"></td>
                     </tr>
                 </tfoot>
            </table>
        </div>
    );
}