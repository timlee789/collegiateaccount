'use client'; // 👈 Client component for year/month selection and filtering

// useMemo와 useState가 이미 import 되어 있는지 확인합니다.
import { useState, useEffect, useMemo } from 'react';
// ⚠️ 수정: getSalesData도 가져옵니다.
import { getAccountingData, getSalesData } from '../actions/accounting';
import TableClientRenderer from './TableClientRenderer'; // Import the client component
import ProtectedPage from '../components/ProtectedPage';

// --- ⬇️ 새로운 컴포넌트 추가 ⬇️ ---
// 모든 월별 요약을 표시하는 테이블 컴포넌트
function MonthlySummaryTable({ summaryData }) {
  if (!summaryData || summaryData.length === 0) {
    return <div className="text-center text-gray-400 py-4">월별 요약 데이터가 없습니다.</div>;
  }

  return (
    // 가로 넓이를 제한하고 중앙 정렬 (max-w-3xl mx-auto)
    // 간격 수정: mb-6
    <div className="max-w-3xl mx-auto overflow-x-auto bg-gray-800 shadow-md rounded-lg border border-gray-700 mb-6">
      <table className="w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">월 (YYYY-MM)</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">월 수입</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">월 지출</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">월 순이익</th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {summaryData.map(({ month, totalRevenue, totalExpense, netIncome }) => (
            <tr key={month} className="hover:bg-gray-700">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{month}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-green-400">{formatAsUSD(totalRevenue)}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-red-400">{formatAsUSD(totalExpense)}</td>
              <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${netIncome >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatAsUSD(netIncome)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// --- ⬆️ 새로운 컴포넌트 추가 ⬆️ ---


// StatCard 컴포넌트 정의
function StatCard({ title, value, color }) {
    // 가정: 어두운 배경이므로 스타일 조정
    // flex-1 추가하여 flex container 안에서 동일한 너비를 갖도록 함
    // Padding 줄임: p-4 -> p-3
    return (
        <div className="p-3 bg-gray-800 shadow-md rounded-lg border-l-4 border-indigo-500 flex-1">
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


export default function DashboardPage() {
  // --- ⬇️ useState 정의 복원 ⬇️ ---
  const [allTransactions, setAllTransactions] = useState([]); // Store all expense transactions
  const [allSalesData, setAllSalesData] = useState([]); // Store all sales data
  const [headers, setHeaders] = useState([]); // Store expense headers
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]); // ⚠️ 수정: "YYYY-MM" 형식 저장
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // ⚠️ 수정: 선택된 "YYYY-MM" 형식 저장
  const [sortConfig, setSortConfig] = useState({ key: 'Date', direction: 'descending' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- ⬆️ useState 정의 복원 ⬆️ ---

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

      setAllTransactions(expenseData || []);
      setAllSalesData(salesData || []);
      setHeaders(fetchedHeaders || (expenseData && expenseData.length > 0 ? Object.keys(expenseData[0]) : []));

      // 데이터에서 고유 연도 추출 및 정렬 (Expense + Sales 데이터 기준)
      const combinedData = [...(expenseData || []), ...(salesData || [])];
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

  // --- ⬇️ 정렬 기능 추가 ⬇️ ---
  // 정렬 요청을 처리하는 핸들러 함수
  // TableClientRenderer로 전달됩니다.
  const handleSort = (key) => {
    let direction = 'ascending';
    // 현재 정렬 키와 같고 오름차순이면, 내림차순으로 변경
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  // --- ⬆️ 정렬 기능 추가 ⬆️ ---

  // --- ⬇️ 모든 월별 요약 계산 로직 추가 ⬇️ ---
  const allMonthsSummary = useMemo(() => {
    // 로딩 중이거나 데이터가 없으면 빈 배열 반환
    if (isLoading || (allTransactions.length === 0 && allSalesData.length === 0)) {
      return [];
    }

    const monthlySummaries = {}; // 예: { '2025-10': { revenue: 0, expense: 0 }, ... }

    // 모든 Expense 데이터 순회
    allTransactions.forEach(t => {
      if (!t || !t.Date || t.Div !== 'Expense') return; // 날짜 없거나 지출 아니면 건너뜀
      const dateObj = new Date(t.Date);
      if (!(dateObj instanceof Date && !isNaN(dateObj))) return; // 유효하지 않은 날짜 건너뜀

      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = { totalRevenue: 0, totalExpense: 0 };
      }
      monthlySummaries[monthKey].totalExpense += parseCurrency(t.Amount);
    });

    // 모든 Sales 데이터 순회
    allSalesData.forEach(s => {
      if (!s || !s.Date || !s.Total) return; // 날짜나 Total 없으면 건너뜀
      const dateObj = new Date(s.Date);
      if (!(dateObj instanceof Date && !isNaN(dateObj))) return; // 유효하지 않은 날짜 건너뜀

      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = { totalRevenue: 0, totalExpense: 0 };
      }
      monthlySummaries[monthKey].totalRevenue += parseCurrency(s.Total);
    });

    // 객체를 배열로 변환하고 순이익 계산 및 정렬
    const summaryArray = Object.entries(monthlySummaries)
      .map(([month, totals]) => ({
        month,
        ...totals,
        netIncome: totals.totalRevenue - totals.totalExpense,
      }))
      .sort((a, b) => b.month.localeCompare(a.month)); // 최신 월 순서로 정렬

    return summaryArray;

  }, [allTransactions, allSalesData, isLoading]); // 로딩 상태도 의존성 배열에 추가
  // --- ⬆️ 모든 월별 요약 계산 로직 추가 ⬆️ ---


  // 3. 선택된 연도/월 기준으로 거래 내역 필터링 및 요약 계산
  const { filteredTransactions, selectedPeriodSummary } = useMemo(() => {
    console.log(`Calculating summary for ${selectedMonth}`);
    if (!selectedMonth || (allTransactions.length === 0 && allSalesData.length === 0)) {
      console.log("Calculation skipped: No month selected or no data.");
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
        const transactionMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === selectedMonth;
    });
    console.log(`Filtered Expenses count for ${selectedMonth}:`, filteredExpenses.length);

    // 필터링된 데이터를 'sortConfig'에 따라 정렬합니다.
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
      if (a[sortConfig.key] === undefined || a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === undefined || b[sortConfig.key] === null) return -1;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      let comparison = 0;

      if (sortConfig.key === 'Date') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        comparison = dateA - dateB;
      } else if (sortConfig.key === 'Amount') {
        comparison = parseCurrency(aValue) - parseCurrency(bValue);
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });

    // 선택된 연도와 월("YYYY-MM")로 Sales 데이터 필터링 (Date 컬럼 기준)
    const filteredSales = allSalesData.filter(s => {
        if (!s || !s.Date) return false;
        const dateObj = new Date(s.Date);
        if (!(dateObj instanceof Date && !isNaN(dateObj))) return false;
        const transactionMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === selectedMonth;
    });
    console.log(`Filtered Sales count for ${selectedMonth}:`, filteredSales.length);

    // 필터링된 Expense 데이터 기반으로 해당 월의 지출 계산
    let monthlyExpense = 0;
    sortedExpenses.forEach(t => {
        if (t.Div === 'Expense') {
            monthlyExpense += parseCurrency(t.Amount);
        }
    });
    console.log("Calculated Monthly Expense:", monthlyExpense);

    // 필터링된 Sales 데이터 기반으로 해당 월의 수입(Total) 계산
    let monthlyRevenue = 0;
    filteredSales.forEach(s => {
        monthlyRevenue += parseCurrency(s.Total);
    });
    console.log("Calculated Monthly Revenue (Sales Total):", monthlyRevenue);

    const monthlyNetIncome = monthlyRevenue - monthlyExpense;

    return {
      filteredTransactions: sortedExpenses,
      selectedPeriodSummary: { totalRevenue: monthlyRevenue, totalExpense: monthlyExpense, netIncome: monthlyNetIncome }
    };
  }, [allTransactions, allSalesData, selectedMonth, sortConfig]);


  // 가정: 어두운 배경
  return (
    <>
    <ProtectedPage>
      {/* 전체 너비 사용 & 간격 조정 */}
      <div className="pt-1 pb-2 px-2 mx-auto text-white">
        {/* 제목 색상 변경 (text-white) & 간격 조정 */}
        <h1 className="text-4xl font-extrabold text-white border-b border-gray-700 pb-1">대시보드</h1>

        {/* --- ⬇️ 모든 월별 요약 테이블 렌더링 추가 ⬇️ --- */}
        <h2 className="text-xl font-semibold text-white mt-2 mb-1">전체 월별 요약</h2>
        {isLoading ? (
             <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
        ) : (
             <MonthlySummaryTable summaryData={allMonthsSummary} />
        )}
        {/* --- ⬆️ 모든 월별 요약 테이블 렌더링 추가 ⬆️ --- */}

        {/* 연도 및 월 선택 드롭다운 */}
        {/* ⚠️ 레이아웃 수정: 중앙 정렬을 위해 justify-center 추가 */}
        <div className="flex justify-center items-end space-x-4 mt-4">
          {/* 연도 선택 */}
          <div>
            {/* ⚠️ 스타일 수정: 라벨 글씨 크기 키움 (text-sm -> text-base) */}
            <label htmlFor="year-select" className="block text-base font-semibold text-white">
              연도 선택:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full py-1.5 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus-border-indigo-500 text-base"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* 월 선택 */}
          <div>
            {/* ⚠️ 스타일 수정: 라벨 글씨 크기 키움 (text-sm -> text-base) */}
            <label htmlFor="month-select" className="block text-base font-semibold text-white">
              월 선택:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={!selectedYear || availableMonths.length === 0}
              className="block w-full py-1.5 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus-border-indigo-500 text-base disabled:opacity-50"
            >
              <option value="" disabled={selectedMonth !== ''}>-- 월 선택 --</option>
              {availableMonths.map(monthYYYYMM => (
                <option key={monthYYYYMM} value={monthYYYYMM}>{monthYYYYMM}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. 선택된 월 재무 요약 섹션 */}
        {/* ⚠️ 레이아웃 수정: 너비 제한 및 중앙 정렬 (max-w-3xl mx-auto) */}
        <div className="max-w-3xl mx-auto mt-4">
            <h2 className="text-xl font-semibold text-white">{selectedMonth} 요약</h2>
            <div className="flex flex-col md:flex-row gap-1 mt-1">
              <StatCard title="월 수입 (Sales Total)" value={formatAsUSD(selectedPeriodSummary.totalRevenue)} color="text-green-400" />
              <StatCard title="월 지출 (Expense)" value={formatAsUSD(selectedPeriodSummary.totalExpense)} color="text-red-400" />
              <StatCard title="월 순이익" value={formatAsUSD(selectedPeriodSummary.netIncome)} color={selectedPeriodSummary.netIncome >= 0 ? "text-blue-400" : "text-red-400"} />
            </div>
        </div>

        {/* 2. 선택된 월의 거래 내역 (전체 너비 유지) */}
        <h2 className="text-xl font-semibold text-white mt-4">{selectedMonth} 지출(Expense) 내역</h2>
        {isLoading ? (
            <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
        ): filteredTransactions.length > 0 ? (
            <TableClientRenderer
              transactions={filteredTransactions}
              headers={headers}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
        ) : (
            <div className="text-center text-gray-400 py-4">선택된 기간에 지출 내역이 없습니다.</div>
        )}
      </div>
      </ProtectedPage>
    </>
  );
}

