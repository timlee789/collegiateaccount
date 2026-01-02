'use client'; // 👈 Client component for year/month selection and filtering

// useMemo와 useState가 이미 import 되어 있는지 확인합니다.
import { useState, useEffect, useMemo } from 'react';
// ⚠️ 수정: getSalesData도 가져옵니다.
import { getAccountingData, getSalesData } from '../actions/accounting';
import TableClientRenderer from './TableClientRenderer'; // Import the client component
import ProtectedPage from '../components/ProtectedPage';

// --- ⬇️ "전체 월별 요약" 테이블 수정 ⬇️ ---
function MonthlySummaryTable({ summaryData }) {
  if (!summaryData || summaryData.length === 0) {
    return <div className="text-center text-gray-400 py-4">월별 요약 데이터가 없습니다.</div>;
  }

  return (
    // ⚠️ 수정: 8열이 되므로 max-w-7xl로 너비 확장
    <div className="max-w-7xl mx-auto overflow-x-auto bg-gray-800 shadow-md rounded-lg border border-gray-700 mb-6">
      <table className="w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">월 (YYYY-MM)</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">월 매출</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Deposit</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Cash</th>
            {/* ⚠️ 수정: "Commision" 열 추가 */}
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Commision</th>
            {/* ⚠️ 수정: "%" 열 추가 */}
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">%</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">월 지출</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">공식수익</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">비공식수익</th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {/* ⚠️ 수정: commission, commissionPercentage 구조분해 */}
          {summaryData.map(({ month, totalRevenue, totalDeposit, totalCash, totalExpense, officialNetIncome, unofficialNetIncome, commission, commissionPercentage }) => (
            <tr key={month} className="hover:bg-gray-700">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{month}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-green-400">{formatAsUSD(totalRevenue)}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-yellow-400">{formatAsUSD(totalDeposit)}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-cyan-400">{formatAsUSD(totalCash)}</td>
              {/* ⚠️ 수정: "Commision" 값 표시 (주황색) */}
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-orange-400">{formatAsUSD(commission)}</td>
              {/* ⚠️ 수정: "Commision %" 값 표시 (주황색) */}
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-orange-400">{commissionPercentage.toFixed(2)}%</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-red-400">{formatAsUSD(totalExpense)}</td>
              <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${officialNetIncome >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatAsUSD(officialNetIncome)}
              </td>
              <td className={`px-4 py-2 whitespace-nowrap text-sm text-right ${unofficialNetIncome >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatAsUSD(unofficialNetIncome)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// --- ⬆️ "전체 월별 요약" 테이블 수정 ⬆️ ---


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
      // ⚠️ 수정: 2026년 강제 추가
      const combinedData = [...(expenseData || []), ...(salesData || [])];
      const yearsFromData = combinedData
        .map(t => {
          if (!t || !t.Date) return null;
          const dateObj = new Date(t.Date);
          return dateObj instanceof Date && !isNaN(dateObj) ? dateObj.getFullYear() : null;
        })
        .filter(Boolean);

      // Set을 사용하여 중복 제거 및 2026년 추가
      const years = [...new Set([...yearsFromData, 2026])].sort((a, b) => b - a);
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
    // ⚠️ 수정: 데이터가 없어도 연도가 선택되어 있다면 월 목록 생성 로직으로 진행
    if (!selectedYear) {
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
    let monthsForYear = [...new Set(combinedDataForYear
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

    // ⚠️ 수정: 데이터가 없는 경우 (예: 2026년) 1월부터 12월까지 기본 생성
    if (monthsForYear.length === 0) {
      monthsForYear = Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return `${selectedYear}-${month}`;
      }).sort((a, b) => b.localeCompare(a)); // 내림차순 (12월부터 1월)
    }

    setAvailableMonths(monthsForYear); // "YYYY-MM" 형식 목록 저장

    // 해당 연도의 최신 "YYYY-MM" 월 기본 설정
    // ⚠️ 수정: 이미 선택된 월이 새로운 목록에 있다면 유지, 아니면 최신 월 선택
    if (monthsForYear.length > 0) {
      if (selectedMonth && monthsForYear.includes(selectedMonth)) {
        // Keep current selection
      } else {
        setSelectedMonth(monthsForYear[0]);
      }
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

  // --- ⬇️ 모든 월별 요약 계산 로직 수정 ⬇️ ---
  const allMonthsSummary = useMemo(() => {
    // 로딩 중이거나 데이터가 없으면 빈 배열 반환
    if (isLoading || (allTransactions.length === 0 && allSalesData.length === 0)) {
      return [];
    }

    const monthlySummaries = {}; // 예: { '2025-10': { revenue: 0, expense: 0, deposit: 0, cash: 0 }, ... }

    // 모든 Expense 데이터 순회
    allTransactions.forEach(t => {
      if (!t || !t.Date || t.Div !== 'Expense') return;
      const dateObj = new Date(t.Date);
      if (!(dateObj instanceof Date && !isNaN(dateObj))) return;

      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = { totalRevenue: 0, totalExpense: 0, totalDeposit: 0, totalCash: 0 };
      }
      // ⚠️ 수정: 월 지출을 t.Amount가 아닌 t.TOTAL로 합산
      monthlySummaries[monthKey].totalExpense += parseCurrency(t.TOTAL);
    });

    // 모든 Sales 데이터 순회
    allSalesData.forEach(s => {
      if (!s || !s.Date || (!s.Total && !s.Deposit && !s.Cash)) return;
      const dateObj = new Date(s.Date);
      if (!(dateObj instanceof Date && !isNaN(dateObj))) return;

      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = { totalRevenue: 0, totalExpense: 0, totalDeposit: 0, totalCash: 0 };
      }
      monthlySummaries[monthKey].totalRevenue += parseCurrency(s.Total);
      monthlySummaries[monthKey].totalDeposit += parseCurrency(s.Deposit);
      monthlySummaries[monthKey].totalCash += parseCurrency(s.Cash);
    });

    // 객체를 배열로 변환하고 순이익 계산 및 정렬
    const summaryArray = Object.entries(monthlySummaries)
      .map(([month, totals]) => {
        // ⚠️ 수정: Commision 및 % 계산 추가
        const commission = (totals.totalDeposit + totals.totalCash) - totals.totalRevenue;
        const commissionPercentage = totals.totalRevenue === 0 ? 0 : (commission / totals.totalRevenue) * 100;

        return {
          month,
          totalRevenue: totals.totalRevenue,
          totalExpense: totals.totalExpense,
          totalDeposit: totals.totalDeposit,
          totalCash: totals.totalCash,
          officialNetIncome: totals.totalDeposit - totals.totalExpense,
          unofficialNetIncome: (totals.totalDeposit + totals.totalCash) - totals.totalExpense,
          commission: commission, // ⚠️ 수정: commission 값 전달
          commissionPercentage: commissionPercentage, // ⚠️ 수정: commissionPercentage 값 전달
        }
      })
      .sort((a, b) => b.month.localeCompare(a.month)); // 최신 월 순서로 정렬

    return summaryArray;

  }, [allTransactions, allSalesData, isLoading]); // 로딩 상태도 의존성 배열에 추가
  // --- ⬆️ 모든 월별 요약 계산 로직 수정 ⬆️ ---


  // 3. 선택된 연도/월 기준으로 거래 내역 필터링 및 요약 계산
  const { filteredTransactions, selectedPeriodSummary } = useMemo(() => {
    console.log(`Calculating summary for ${selectedMonth}`);
    if (!selectedMonth || (allTransactions.length === 0 && allSalesData.length === 0)) {
      console.log("Calculation skipped: No month selected or no data.");
      return {
        filteredTransactions: [],
        // ⚠️ 수정: totalDeposit, totalCash 등 모든 값 초기화
        selectedPeriodSummary: {
          totalRevenue: 0,
          totalDeposit: 0,
          totalCash: 0,
          totalExpense: 0,
          officialNetIncome: 0,
          unofficialNetIncome: 0,
          commission: 0, // ⚠️ 수정: commission 추가
          commissionPercentage: 0 // ⚠️ 수정: commissionPercentage 추가
        }
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
        // ⚠️ 수정: 정렬 기준을 t.Amount에서 t.TOTAL로 변경 (단, 헤더 키가 'Amount'로 하드코딩된 경우 주의)
        // 만약 sortConfig.key가 'Amount'인데 실제 정렬은 TOTAL로 해야한다면,
        // page.js의 handleSort와 TableClientRenderer.js의 헤더 키를 'TOTAL'로 맞추거나,
        // 여기서 'Amount' 키일 때 특별 처리를 해야 합니다.
        // 여기서는 일단 'Amount' 키가 t.Amount를 의미한다고 가정하고 그대로 둡니다.
        //
        // ⚠️ [정정] 지출 내역 테이블(TableClientRenderer)의 정렬 키(sortConfig.key)가 'Amount'일 때
        // 회원님의 요청(TOTAL이 총지출)에 따라 t.TOTAL을 기준으로 정렬해야 합니다.
        // 하지만 'TOTAL'이라는 키가 expense 시트에 없을 수 있습니다.
        // 'Amount' 키일 때 (Amount + Cash)를 기준으로 정렬해야 하나요?
        // 일단은 회원님이 'Amount' 컬럼의 합계가 아니라고 하셨으니, 'TOTAL' 컬럼을 기준으로 정렬하겠습니다.
        // [다시 정정]
        // 지출 내역(Expense) 시트의 'TOTAL' 컬럼의 합계를 내어야 합니다.
        // `sortedExpenses`는 `allTransactions` (Expense 시트)에서 필터링된 것입니다.
        if (sortConfig.key === 'Amount') {
          comparison = parseCurrency(aValue) - parseCurrency(bValue); // 'Amount' 키 기준 정렬
        } else if (sortConfig.key === 'TOTAL') { // 만약 정렬 키가 'TOTAL'이라면
          comparison = parseCurrency(aValue) - parseCurrency(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
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
        // ⚠️ 수정: 월 지출을 t.Amount가 아닌 t.TOTAL로 합산
        monthlyExpense += parseCurrency(t.TOTAL);
      }
    });
    console.log("Calculated Monthly Expense:", monthlyExpense);

    // 필터링된 Sales 데이터 기반으로 해당 월의 수입(Total), Deposit, Cash 계산
    let monthlyRevenue = 0;
    let monthlyDeposit = 0;
    let monthlyCash = 0;
    filteredSales.forEach(s => {
      monthlyRevenue += parseCurrency(s.Total);
      monthlyDeposit += parseCurrency(s.Deposit);
      monthlyCash += parseCurrency(s.Cash);
    });
    console.log("Calculated Monthly Revenue (Sales Total):", monthlyRevenue);
    console.log("Calculated Monthly Deposit:", monthlyDeposit);
    console.log("Calculated Monthly Cash:", monthlyCash);

    // ⚠️ 수정: 순이익 및 Commision 계산 변경
    const officialNetIncome = monthlyDeposit - monthlyExpense; // 공식수익
    const unofficialNetIncome = (monthlyDeposit + monthlyCash) - monthlyExpense; // 비공식수익
    const commission = (monthlyDeposit + monthlyCash) - monthlyRevenue; // Commision
    const commissionPercentage = monthlyRevenue === 0 ? 0 : (commission / monthlyRevenue) * 100; // Commision %

    return {
      filteredTransactions: sortedExpenses,
      selectedPeriodSummary: {
        totalRevenue: monthlyRevenue,
        totalDeposit: monthlyDeposit,
        totalCash: monthlyCash,
        totalExpense: monthlyExpense,
        officialNetIncome: officialNetIncome,
        unofficialNetIncome: unofficialNetIncome,
        commission: commission, // ⚠️ 수정: commission 전달
        commissionPercentage: commissionPercentage // ⚠️ 수정: commissionPercentage 전달
      }
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
                className="block w-full py-1.5 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
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
                className="block w-full py-1.5 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base disabled:opacity-50"
              >
                <option value="" disabled={selectedMonth !== ''}>-- 월 선택 --</option>
                {availableMonths.map(monthYYYYMM => (
                  <option key={monthYYYYMM} value={monthYYYYMM}>{monthYYYYMM}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 1. 선택된 월 재무 요약 섹션 */}
          {/* ⚠️ 레이아웃 수정: 6개 카드를 표시하기 위해 grid-cols-6 사용 */}
          <div className="max-w-7xl mx-auto mt-4"> {/* ⚠️ 수정: max-w-6xl -> max-w-7xl */}
            <h2 className="text-xl font-semibold text-white">{selectedMonth} 요약</h2>
            {/* ⚠️ 수정: 6-column grid로 변경, gap-2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-1">
              <StatCard title="월 매출 (Sales Total)" value={formatAsUSD(selectedPeriodSummary.totalRevenue)} color="text-green-400" />
              <StatCard title="월 Deposit" value={formatAsUSD(selectedPeriodSummary.totalDeposit)} color="text-yellow-400" />
              <StatCard title="월 Cash" value={formatAsUSD(selectedPeriodSummary.totalCash)} color="text-cyan-400" />
              {/* ⚠️ 수정: "Commision" StatCard 추가 (주황색) */}
              <StatCard
                title="Commision ((D+C)-Rev)"
                value={`${formatAsUSD(selectedPeriodSummary.commission)} (${selectedPeriodSummary.commissionPercentage.toFixed(1)}%)`}
                color="text-orange-400"
              />
              <StatCard title="월 지출 (Expense)" value={formatAsUSD(selectedPeriodSummary.totalExpense)} color="text-red-400" />
              <StatCard
                title="비공식수익 (D+C-Exp)"
                value={formatAsUSD(selectedPeriodSummary.unofficialNetIncome)}
                color={selectedPeriodSummary.unofficialNetIncome >= 0 ? "text-blue-400" : "text-red-400"}
              />
            </div>
          </div>

          {/* 2. 선택된 월의 거래 내역 (전체 너비 유지) */}
          <h2 className="text-xl font-semibold text-white mt-4">{selectedMonth} 지출(Expense) 내역</h2>
          {isLoading ? (
            <div className="text-center text-gray-400 py-4">데이터 로딩 중...</div>
          ) : filteredTransactions.length > 0 ? (
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