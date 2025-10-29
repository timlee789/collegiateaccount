import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 text-center bg-gray-50">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">The Collegiate Grill </h1>
    
      
      <div className="flex space-x-6">
        <Link href="/dashboard" className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition duration-150">
          📊 전체보기
        </Link>
        <Link href="/report-detail" className="px-8 py-3 text-lg font-medium text-indigo-600 border border-indigo-600 rounded-lg shadow-lg hover:bg-indigo-50 transition duration-150">
          ➕ 월별 Detail
        </Link>
        {/* 월별 보고서 링크를 추가합니다. */}
        <Link href="/report" className="px-8 py-3 text-lg font-medium text-purple-600 border border-purple-600 rounded-lg shadow-lg hover:bg-purple-50 transition duration-150">
          📈 월별 Report
        </Link>
        <Link href="/sales-report" className="px-8 py-3 text-lg font-medium text-purple-600 border border-purple-600 rounded-lg shadow-lg hover:bg-purple-50 transition duration-150">
          📈 월별 Sales
        </Link>
      </div>
    </div>
  );
}
