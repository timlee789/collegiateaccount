'use client'; // Client component

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
 * 월별 카테고리별 지출 합계 테이블
 */
export default function CategoryReportTable({ data }) { // Changed to default export
    if (!data || Object.keys(data).length === 0) {
        return <p className="text-center text-gray-400">분석할 거래 내역이 없습니다.</p>;
    }

    // 모든 월과 카테고리를 추출하고 정렬합니다.
    const months = Object.keys(data).sort();
    const categories = [...new Set(months.flatMap(month => Object.keys(data[month])))].sort();

    // 월별 총합계 계산
    const monthlyTotals = months.reduce((acc, month) => {
        acc[month] = categories.reduce((sum, category) => sum + (data[month][category] || 0), 0);
        return acc;
    }, {});

    // 카테고리별 총합계 계산
    const categoryTotals = categories.reduce((acc, category) => {
        acc[category] = months.reduce((sum, month) => sum + (data[month][category] || 0), 0);
        return acc;
    }, {});

    // 전체 총합계 계산
    const grandTotal = months.reduce((sum, month) => sum + monthlyTotals[month], 0);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                    <tr>
                        {/* 첫 번째 열 (카테고리) - 굵게 */}
                        <th className="px-3 py-2 text-left text-sm font-bold text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-700 z-10">Category</th>
                        {/* 월 헤더 - 굵게 */}
                        {months.map(month => (
                            <th key={month} className="px-3 py-2 text-right text-sm font-bold text-gray-300 uppercase tracking-wider">
                                {month}
                            </th>
                        ))}
                        {/* 마지막 열 (카테고리 총합계) - 굵게 */}
                        <th className="px-3 py-2 text-right text-sm font-bold text-gray-300 uppercase tracking-wider">Category Total</th>
                    </tr>
                </thead>
                {/* ⚠️ 수정: <tbody> 바로 다음 줄에 공백이 없도록 합니다. */}
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {categories.map(category => (
                        <tr key={category} className="hover:bg-gray-700">
                            {/* 첫 번째 열 (카테고리명) - 굵게 */}
                            <td className="px-3 py-2 text-sm font-bold text-gray-200 whitespace-nowrap sticky left-0 bg-gray-800 z-10">{category}</td>
                            {/* 월별 데이터 */}
                            {months.map(month => (
                                <td key={month} className="px-3 py-2 text-sm text-gray-200 text-right whitespace-nowrap">
                                    {formatAsUSD(data[month][category] || 0)}
                                </td>
                            ))}
                            {/* 카테고리별 총합계 */}
                            <td className="px-3 py-2 text-sm font-semibold text-gray-200 text-right whitespace-nowrap">
                                {formatAsUSD(categoryTotals[category] || 0)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-700 border-t-2 border-gray-600">
                    <tr>
                        {/* 첫 번째 열 (월별 총합계 레이블) - 굵게 */}
                        <td className="px-3 py-2 text-sm font-bold text-gray-200 sticky left-0 bg-gray-700 z-10">Monthly Total</td>
                        {/* 월별 총합계 */}
                        {months.map(month => (
                            <td key={month} className="px-3 py-2 text-sm font-bold text-gray-200 text-right">
                                {formatAsUSD(monthlyTotals[month] || 0)}
                            </td>
                        ))}
                        {/* 전체 총합계 */}
                        <td className="px-3 py-2 text-sm font-extrabold text-white text-right">
                            {formatAsUSD(grandTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

