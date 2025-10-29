'use client'; // 👈 Client component for year/month selection and filtering

import { useState, useEffect, useMemo } from 'react';
// ⚠️ 수정: getSalesData도 가져옵니다.
import { getAccountingData, getSalesData } from '../actions/accounting';
import TableClientRenderer from './TableClientRenderer'; // Import the client component
import ProtectedPage from '../components/ProtectedPage';

// StatCard 컴포넌트 정의
function StatCard({ title, value, color }) {
    // 가정: 어두운 배경이므로 스타일 조정
    return (
        <div className="p-5 bg-gray-800 shadow-md rounded-lg border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400 font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
    );
}

// USD 통화 형식 헬퍼 함수
function formatAsUSD(value) {
    const numericValue = parseFloat(String(value || '0').replace(/[^0-9.-]+/g, ''));
    if (isNaN(numericValue)) {
        return '$0.00';
    }
    return `$${numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

// 숫자 변환 헬퍼 함수 (Amount, Total 등 처리용)
function parseCurrency(value) {
    return parseFloat(String(value || '0').replace(/[^0-9.-]+/g, '')) || 0;
}

// ⚠️ 제거: 월 이름 관련 상수 제거
// const monthNameToNumber = { ... };
// const monthIndexToName = [ ... ];


export default function DashboardPage() {
  const [allTransactions, setAllTransactions] = useState([]); // Store all expense transactions
  const [allSalesData, setAllSalesData] = useState([]); // Store all sales data
  const [headers, setHeaders] = useState([]); // Store expense headers
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]); // ⚠️ 수정: "YYYY-MM" 형식 저장
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // ⚠️ 수정: 선택된 "YYYY-MM" 형식 저장
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 페이지 로드 시 전체 거래 내역, Sales 데이터, 헤더 가져오기
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      // Fetch both expense and sales data in parallel
      const [expenseResult, salesResult] = await Promise.all([
          getAccountingData(),
          getSalesData()
      ]);

      const { data: expenseData, headers: fetchedHeaders, error: expenseError } = expenseResult;
      const { data: salesData, error: salesError } = salesResult;

      if (expenseError || salesError) {
        setError(expenseError || salesError);
        setIsLoading(false);
        return;
      }

      // 날짜 기준으로 초기 정렬 (최신순) - Expense 데이터 기준
      const sortedData = expenseData
        ? [...expenseData].sort((a, b) => {
            const dateA = new Date(a.Date);
            const dateB = new Date(b.Date);
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            return dateB - dateA;
          })
        : [];

      setAllTransactions(sortedData);
      setAllSalesData(salesData || []);
      // console.log("Loaded Sales Data:", salesData);
      setHeaders(fetchedHeaders || (sortedData.length > 0 ? Object.keys(sortedData[0]) : []));

      // 데이터에서 고유 연도 추출 및 정렬 (Expense + Sales 데이터 기준)
      const combinedData = [...sortedData, ...(salesData || [])];
      const years = [...new Set(combinedData
        .map(t => {
            if (!t || !t.Date) return null;
            const dateObj = new Date(t.Date);
            return dateObj instanceof Date && !isNaN(dateObj) ? dateObj.getFullYear() : null;
        })
        .filter(Boolean)
      )].sort((a, b) => b - a);
      setAvailableYears(years);

      // 최신 연도 기본 설정
      if (years.length > 0) {
        setSelectedYear(years[0].toString());
      } else {
        setSelectedYear(new Date().getFullYear().toString());
      }
      setIsLoading(false);
    }
    loadData();
  }, []); // Run only once on mount

  // 2. 선택된 연도가 변경되면 해당 연도의 월 목록 업데이트 (Expense + Sales 데이터 기준)
  useEffect(() => {
    if (!selectedYear || (allTransactions.length === 0 && allSalesData.length === 0)) {
      setAvailableMonths([]);
      setSelectedMonth('');
      return;
    }

    const combinedDataForYear = [...allTransactions, ...allSalesData].filter(t => {
        if (!t || !t.Date) return false;
        const dateObj = new Date(t.Date);
        return dateObj instanceof Date && !isNaN(dateObj) && dateObj.getFullYear().toString() === selectedYear;
    });

    // ⚠️ 수정: Date 컬럼에서 "YYYY-MM" 형식의 월 추출
    const monthsForYear = [...new Set(combinedDataForYear
        .map(t => {
            if (!t || !t.Date) return null;
            const dateObj = new Date(t.Date);
            // "YYYY-MM" 형식 생성 (예: 2025-09)
            return dateObj instanceof Date && !isNaN(dateObj)
                ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
                : null;
        })
        .filter(Boolean) // null 제거
    )].sort((a, b) => b.localeCompare(a)); // 문자열 내림차순 (최신 월 먼저)

    setAvailableMonths(monthsForYear); // "YYYY-MM" 형식 목록 저장

    // 해당 연도의 최신 "YYYY-MM" 월 기본 설정
    if (monthsForYear.length > 0) {
      setSelectedMonth(monthsForYear[0]);
    } else {
      setSelectedMonth('');
    }
  }, [selectedYear, allTransactions, allSalesData]);

  // 3. 선택된 연도/월 기준으로 거래 내역 필터링 및 요약 계산
  const { filteredTransactions, selectedPeriodSummary } = useMemo(() => {
    // ⚠️ 수정: selectedMonth는 이제 "YYYY-MM" 형식
    console.log(`Calculating summary for ${selectedMonth}`); // 디버깅 로그 (연도 정보 포함됨)
    if (!selectedMonth || (allTransactions.length === 0 && allSalesData.length === 0)) {
        console.log("Calculation skipped: No month selected or no data."); // 디버깅 로그
      return {
          filteredTransactions: [],
          selectedPeriodSummary: { totalRevenue: 0, totalExpense: 0, netIncome: 0 }
      };
    }

    // 선택된 연도와 월("YYYY-MM")로 Expense 데이터 필터링 (Date 컬럼 기준)
    const filteredExpenses = allTransactions.filter(t => {
        if (!t || !t.Date) return false;
        const dateObj = new Date(t.Date);
        if (!(dateObj instanceof Date && !isNaN(dateObj))) return false;
        // ⚠️ 수정: Date에서 "YYYY-MM" 추출하여 비교
        const transactionMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === selectedMonth;
    });
    console.log(`Filtered Expenses count for ${selectedMonth}:`, filteredExpenses.length); // 디버깅 로그

    // 선택된 연도와 월("YYYY-MM")로 Sales 데이터 필터링 (Date 컬럼 기준)
    const filteredSales = allSalesData.filter(s => {
        if (!s || !s.Date) return false;
        const dateObj = new Date(s.Date);
        if (!(dateObj instanceof Date && !isNaN(dateObj))) return false;
        // ⚠️ 수정: Date에서 "YYYY-MM" 추출하여 비교
        const transactionMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === selectedMonth;
    });
    console.log(`Filtered Sales count for ${selectedMonth}:`, filteredSales.length); // 디버깅 로그
    // if (filteredSales.length > 0) {
    //     console.log("First filtered Sales item:", filteredSales[0]); // 첫 Sales 데이터 확인
    // }


    // 필터링된 Expense 데이터 기반으로 해당 월의 지출 계산
    let monthlyExpense = 0;
    filteredExpenses.forEach(t => {
        if (t.Div === 'Expense') {
             monthlyExpense += parseCurrency(t.Amount);
        }
    });
    console.log("Calculated Monthly Expense:", monthlyExpense); // 디버깅 로그

    // 필터링된 Sales 데이터 기반으로 해당 월의 수입(Total) 계산
    let monthlyRevenue = 0;
    filteredSales.forEach((s, index) => {
        const totalValue = s.Total;
        const parsedValue = parseCurrency(totalValue);
        // if (index === 0) {
        //     console.log(`Sales Item ${index}: Raw Total='${totalValue}', Parsed Total=${parsedValue}`);
        // }
        monthlyRevenue += parsedValue;
    });
    console.log("Calculated Monthly Revenue (Sales Total):", monthlyRevenue); // 디버깅 로그

    const monthlyNetIncome = monthlyRevenue - monthlyExpense;

    return {
        filteredTransactions: filteredExpenses,
        selectedPeriodSummary: { totalRevenue: monthlyRevenue, totalExpense: monthlyExpense, netIncome: monthlyNetIncome }
    };
  }, [allTransactions, allSalesData, selectedMonth]); // ⚠️ 수정: selectedYear 제거 (selectedMonth에 포함됨)

 

  // 가정: 어두운 배경
  return (
    <>
    <ProtectedPage>
      {/* 전체 너비 사용 */}
      <div className="p-8 space-y-8 mx-auto mt-10 text-white">
        {/* 제목 색상 변경 (text-white) */}
        <h1 className="text-4xl font-extrabold text-white border-b border-gray-700 pb-4">대시보드</h1>

        {/* 연도 및 월 선택 드롭다운 */}
        <div className="flex items-end space-x-6">
          {/* 연도 선택 */}
          <div className="max-w-xs">
            <label htmlFor="year-select" className="block text-sm font-semibold text-white mb-1">
              연도 선택:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus-border-indigo-500 sm:text-sm"
            >
              {/* 연도 목록은 그대로 사용 */}
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* 월 선택 */}
          <div className="max-w-xs">
            <label htmlFor="month-select" className="block text-sm font-semibold text-white mb-1">
              월 선택:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={!selectedYear || availableMonths.length === 0}
              className="block w-full py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
            >
              <option value="" disabled={selectedMonth !== ''}>-- 월 선택 --</option>
              {/* ⚠️ 수정: "YYYY-MM" 형식 목록 사용 */}
              {availableMonths.map(monthYYYYMM => (
                <option key={monthYYYYMM} value={monthYYYYMM}>{monthYYYYMM}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. 재무 요약 섹션 (선택된 월 기준) */}
        {/* ⚠️ 수정: 제목에 selectedMonth 사용 */}
        <h2 className="text-2xl font-semibold text-white pt-4">{selectedMonth} 요약</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="월 수입 (Sales Total)" value={formatAsUSD(selectedPeriodSummary.totalRevenue)} color="text-green-400" />
          <StatCard title="월 지출 (Expense)" value={formatAsUSD(selectedPeriodSummary.totalExpense)} color="text-red-400" />
          <StatCard title="월 순이익" value={formatAsUSD(selectedPeriodSummary.netIncome)} color={selectedPeriodSummary.netIncome >= 0 ? "text-blue-400" : "text-red-400"} />
        </div>

        {/* 2. 선택된 월의 거래 내역 (Expense 시트 기준) */}
        {/* ⚠️ 수정: 제목에 selectedMonth 사용 */}
        <h2 className="text-2xl font-semibold text-white pt-4">{selectedMonth} 지출(Expense) 내역</h2>
        {isLoading ? ( // 데이터 필터링 중 로딩 표시
             <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
        ): filteredTransactions.length > 0 ? (
             <TableClientRenderer transactions={filteredTransactions} headers={headers} />
        ) : (
             <div className="text-center text-gray-400 py-4">선택된 기간에 지출 내역이 없습니다.</div>
        )}
      </div>
      </ProtectedPage>
    </>
  );
}

