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
        return '$0.00';
    }
    return `$${numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * 월별 상세 경비 보고서 페이지
 */
export default function ReportDetailPage() {
  const [transactions, setTransactions] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
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

      setTransactions(data);

      const months = [...new Set(data.map(t => t.MONTH))].filter(Boolean).sort((a, b) => b.localeCompare(a));
      setAvailableMonths(months);

      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // 2. 선택된 월이 변경될 때마다 데이터를 필터링하고 그룹화하며 월별 총합계를 계산합니다.
  const { groupedData, monthlyTotal } = useMemo(() => {
    if (!selectedMonth || transactions.length === 0) {
      return { groupedData: {}, monthlyTotal: 0 };
    }

    const filtered = transactions.filter(t => t.MONTH === selectedMonth && t.Div === 'Expense');

    const grouped = filtered.reduce((acc, t) => {
      const category = t.Category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(t);
      return acc;
    }, {});

    const total = filtered.reduce((sum, t) => sum + (parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0), 0);

    return { groupedData: grouped, monthlyTotal: total };
  }, [transactions, selectedMonth]);

 

  // ⚠️ 가정: 상위 컴포넌트나 globals.css에서 배경색을 검정색으로 설정했다고 가정합니다.
  return (
    <> {/* Use Fragment to wrap NavBar and page content */}
      <ProtectedPage>
      <div className="p-8 mx-auto mt-10 text-white"> {/* 기본 텍스트 색상을 흰색으로 설정 */}
        {/* 제목 스타일 변경 (text-white 추가) */}
        <h1 className="text-4xl font-extrabold mb-8 text-white border-b border-gray-700 pb-4">월별 상세 경비 보고서</h1>

        {/* 월 선택 및 월별 총합계 표시 */}
        <div className="flex items-end mb-6 space-x-4">
          <div className="max-w-xs">
            {/* 레이블 스타일 변경 (text-white 추가) */}
            <label htmlFor="month-select" className="block text-sm font-semibold text-white mb-1">
              보고서 월 선택:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              // 드롭다운 배경/테두리/텍스트 색상 조정 (어두운 배경용)
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          {/* 월별 총합계 표시 */}
          <div className="pb-1">
              {/* 텍스트 색상 변경 (text-white 추가) */}
              <span className="text-sm font-semibold text-white">Monthly Total: </span>
              {/* 총합계는 강조를 위해 밝은 빨간색 유지 */}
              <span className="text-lg font-bold text-red-400">{formatAsUSD(monthlyTotal)}</span>
          </div>
        </div>

        {/* 선택된 월의 상세 보고서 데이터 */}
        <div className="space-y-6">
          {Object.keys(groupedData).length > 0 ? (
              Object.keys(groupedData).sort().map(category => (
                // 카드 배경/테두리 색상 조정 (어두운 배경용)
                <div key={category} className="bg-gray-800 p-6 shadow-xl rounded-lg border border-gray-700">
                  {/* 카테고리 제목 색상 변경 */}
                  <h2 className="text-2xl font-semibold mb-4 text-indigo-400">{category}</h2>
                  {/* CategoryDetailTable은 하위 컴포넌트이므로, 내부 스타일도 조정해야 할 수 있습니다. */}
                  <CategoryDetailTable transactions={groupedData[category]} />
                </div>
              ))
          ) : (
              <div className="text-center text-gray-400">선택된 월에 지출 내역이 없습니다.</div>
          )}
        </div>
      </div>
      </ProtectedPage>
    </>
  );
}

/**
 * 카테고리별 상세 내역을 표시하는 테이블 컴포넌트 (Payee 그룹화 및 소계 추가)
 * ⚠️ 가정: 상위 컴포넌트가 어두운 배경이므로 테이블 스타일 조정
 */
function CategoryDetailTable({ transactions }) {
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
    const categoryTotal = transactions.reduce((sum, t) => sum + (parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0), 0);
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
                        const payeeSubtotalAmount = payeeTransactions.reduce((sum, t) => sum + (parseFloat(String(t.Amount).replace(/[^0-9.-]+/g, '')) || 0), 0);
                        const payeeSubtotalCash = payeeTransactions.reduce((sum, t) => sum + (parseFloat(String(t.CASH).replace(/[^0-9.-]+/g, '')) || 0), 0);

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
                                <tr className="bg-gray-700 border-t border-gray-600">
                                    <td className="px-4 py-2 text-sm font-semibold text-gray-400 text-right italic">Subtotal for {payee}</td>
                                    <td className="px-4 py-2 text-sm font-semibold text-gray-200 text-right italic">{formatAsUSD(payeeSubtotalAmount)}</td>
                                    <td className="px-4 py-2 text-sm font-semibold text-gray-200 text-right italic">{formatAsUSD(payeeSubtotalCash)}</td>
                                    <td colSpan="3"></td>
                                </tr>
                            </React.Fragment> // 수정: Fragment 닫기 (명시적으로 React.Fragment 사용)
                        );
                    })}
                </tbody>
                <tfoot className="bg-gray-700 border-t-2 border-gray-600">
                    <tr>
                        <td className="px-4 py-2 text-sm font-bold text-gray-200">Category Total</td>
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

