'use client'; // Client component for year selection and data display

import React, { useState, useEffect, useMemo } from 'react'; // Import React for potential Fragments
import { getSalesData } from '../actions/accounting'; // Still need to fetch all sales data
//import NavBar from '../components/NavBar'; // Assuming NavBar exists
import ProtectedPage from '../components/ProtectedPage';
/**
 * USD 통화 형식 헬퍼 함수
 */
function formatAsUSD(value) {
    // Handles strings with $, ,, ensures it's a number
    const numericValue = parseFloat(String(value || '0').replace(/[^0-9.-]+/g, ''));
    if (isNaN(numericValue)) {
        return '$0.00'; // Return $0.00 for invalid numbers
    }
    return `$${numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * 연간 Sales 요약 보고서 페이지 (연도 선택 추가)
 */
export default function SalesReportPage() {
  const [allSalesData, setAllSalesData] = useState([]); // Store all sales data
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the order of columns/categories
  const salesCategories = ['Cash', 'Card', 'Deposit', 'SVC', 'Tips', 'Tax', 'C-Tips', 'Total'];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // 1. 페이지 로드 시 전체 Sales 데이터를 가져옵니다.
  useEffect(() => {
    async function loadSalesData() {
      setIsLoading(true);
      setError(null);
      const { data, error: dataError } = await getSalesData();

      if (dataError) {
        setError(dataError);
        setIsLoading(false);
        return;
      }
      setAllSalesData(data);

      // Extract unique years from data
      const years = [...new Set(data
        .map(t => {
            // Check if t.Date is valid before creating Date object
            if (!t || !t.Date) return null;
            const dateObj = new Date(t.Date);
            return dateObj instanceof Date && !isNaN(dateObj) ? dateObj.getFullYear() : null;
        })
        .filter(Boolean) // Filter out nulls
      )].sort((a, b) => b - a); // Sort years descending

      setAvailableYears(years);

      // Set default year to the latest one
      if (years.length > 0) {
        setSelectedYear(years[0].toString());
      } else {
        setSelectedYear(new Date().getFullYear().toString()); // Fallback to current year
      }

      setIsLoading(false);
    }
    loadSalesData();
  }, []); // Run only once on component mount

  // 2. 선택된 연도의 데이터를 필터링하고 월별/카테고리별로 집계합니다.
  // ⚠️ 수정: yearlySalesData도 반환하도록 변경
  const { yearSummary, yearlySalesData } = useMemo(() => {
    if (!selectedYear || allSalesData.length === 0) {
      return { yearSummary: { monthlySums: {}, categoryTotals: {} }, yearlySalesData: [] };
    }

    // Filter sales data for the selected year
    const filteredYearlyData = allSalesData.filter(sale => {
        if (!sale || !sale.Date) return false;
        const dateObj = new Date(sale.Date);
        return dateObj instanceof Date && !isNaN(dateObj) && dateObj.getFullYear().toString() === selectedYear;
    });

    const monthlySums = {}; // { 'Jan': { Cash: 100, ... }, 'Feb': {...} }
    const categoryTotals = {}; // { Cash: 500, ... }

    salesCategories.forEach(cat => categoryTotals[cat] = 0);

    filteredYearlyData.forEach(sale => {
      const dateObj = new Date(sale.Date);
      if (dateObj instanceof Date && !isNaN(dateObj)) {
          const monthIndex = dateObj.getMonth();
          const monthName = monthNames[monthIndex];

          if (monthName) {
            if (!monthlySums[monthName]) {
              monthlySums[monthName] = {};
              salesCategories.forEach(cat => monthlySums[monthName][cat] = 0);
            }

            salesCategories.forEach(cat => {
              const value = parseFloat(String(sale[cat] || '0').replace(/[^0-9.-]+/g, '')) || 0;
              monthlySums[monthName][cat] += value;
              categoryTotals[cat] += value;
            });
          }
      }
    });

    // ⚠️ 수정: yearlySalesData(필터링된 데이터)와 yearSummary(계산된 요약)를 함께 반환
    return { yearSummary: { monthlySums, categoryTotals }, yearlySalesData: filteredYearlyData };
  }, [allSalesData, selectedYear, salesCategories, monthNames]);

  
  // Assuming dark background
  return (
    <>
      <ProtectedPage>
      <div className="p-8 mx-auto mt-10 text-white">
        {/* Title updated to reflect selected year */}
        <h1 className="text-4xl font-extrabold mb-8 text-white border-b border-gray-700 pb-4">Sales 요약 보고서 ({selectedYear})</h1>

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

        {/* 월별 Sales 요약 테이블 */}
        <div className="bg-gray-800 p-6 shadow-xl rounded-lg border border-gray-700 overflow-x-auto">
          {/* ⚠️ 수정: yearSummary 대신 yearlySalesData로 데이터 유무 확인 */}
          {yearlySalesData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-700">
               <thead className="bg-gray-700">
                 <tr>
                   <th className="px-4 py-2 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Month</th>
                   {salesCategories.map(header => (
                     <th key={header} className="px-4 py-2 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">
                       {header}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody className="bg-gray-800 divide-y divide-gray-700">
                 {/* Generate rows only for months that exist in the selected year's data */}
                 {monthNames.map((monthName) => (
                   // ⚠️ 수정: yearSummary 사용
                   yearSummary.monthlySums[monthName] ? (
                     <tr key={monthName} className="hover:bg-gray-700">
                       <td className="px-4 py-2 text-sm font-semibold text-gray-200 whitespace-nowrap">{monthName}</td>
                       {salesCategories.map(cat => (
                         <td key={cat} className="px-4 py-2 text-sm text-gray-200 text-right whitespace-nowrap">
                           {/* ⚠️ 수정: yearSummary 사용 */}
                           {formatAsUSD(yearSummary.monthlySums[monthName]?.[cat] || 0)}
                         </td>
                       ))}
                     </tr>
                   ) : null // Don't render row if no data for the month
                 ))}
               </tbody>
               {/* Footer for Category Totals - updated to show year */}
               <tfoot className="bg-gray-700 border-t-2 border-gray-600">
                   <tr>
                       <td className="px-4 py-2 text-sm font-bold text-gray-200">Yearly Totals ({selectedYear})</td>
                       {salesCategories.map(cat => (
                           <td key={cat} className="px-4 py-2 text-sm font-bold text-gray-200 text-right">
                               {/* ⚠️ 수정: yearSummary 사용 */}
                               {formatAsUSD(yearSummary.categoryTotals[cat] || 0)}
                           </td>
                       ))}
                   </tr>
               </tfoot>
            </table>
          ) : (
            <div className="text-center text-gray-400 py-4">선택된 연도({selectedYear})에 Sales 데이터가 없습니다.</div>
          )}
        </div>
      </div>
      </ProtectedPage>
    </>
  );
}

