'use client';

// 1. (NEW) 정렬 아이콘 헬퍼
const getSortIcon = (header, sortConfig) => {
  // 현재 정렬 중인 컬럼의 key와 헤더 이름이 일치하는지 확인 (대소문자 무시)
  const isSortingThisColumn = sortConfig && sortConfig.key.toLowerCase() === header.toLowerCase();

  if (!isSortingThisColumn) {
    // 정렬 중이 아닐 때는 호버 시에만 아이콘 표시
    return <span className="opacity-0 group-hover:opacity-50 transition-opacity">↕</span>;
  }
  if (sortConfig.direction === 'ascending') {
    return ' ▲'; // 오름차순
  }
  return ' ▼'; // 내림차순
};

// 2. (NEW) 사용자가 요청한 정렬 가능 컬럼 목록 (대소문자 구분 없음)
const USER_SORTABLE_COLUMNS = ['DATE', 'CATEGORY', 'PAYEES', 'TYPE'];

/**
 * USD 통화 형식 헬퍼 함수
 */
function formatAsUSD(value) {
    // 값이 이미 '$87.52' 형태일 수 있으므로, 숫자 외 문자를 제거하고 다시 포맷합니다.
    const cleanValue = parseFloat(String(value || '0').replace(/[^0-9.-]+/g, ""));
    return `$${(cleanValue).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * 서버에서 받은 데이터를 읽기 전용 테이블로 렌더링하는 클라이언트 컴포넌트
 * 3. (NEW) onSort와 sortConfig props를 받도록 수정
 */
export default function TableClientRenderer({ transactions, headers, onSort, sortConfig }) {
 
  if (!transactions || transactions.length === 0) {
    return (
      // 4. (THEME FIX) 부모 컴포넌트(page.js)의 어두운 테마에 맞게 수정
      <div className="p-4 text-center text-gray-400 bg-gray-800 shadow-xl rounded-lg border border-gray-700">
        거래 내역이 없습니다.
      </div>
    );
  }

  // __rowIndex를 제외한 헤더만 표시
  const displayHeaders = headers.filter(h => h !== '__rowIndex');
 
  // 통화 형식을 적용할 컬럼 목록 (Google Sheets 헤더와 일치해야 함)
  const currencyColumns = ['Amount', 'CASH', 'TOTAL'];

  // 5. (NEW) 정렬 가능한 헤더 맵 생성 (대소문자 무시)
  const sortableHeaderMap = {};
  const lowerCaseUserSortable = USER_SORTABLE_COLUMNS.map(h => h.toLowerCase());
  displayHeaders.forEach(header => {
    if (lowerCaseUserSortable.includes(header.toLowerCase())) {
      sortableHeaderMap[header] = true;
    }
  });

  return (
    // 6. (THEME FIX) 어두운 테마 적용
    <div className="overflow-x-auto bg-gray-800 shadow-xl rounded-lg border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700">
        {/* 7. (THEME FIX) 어두운 테마 적용 */}
        <thead className="bg-gray-700">
          <tr>
            {displayHeaders.map(header => {
              // 8. (NEW) 정렬 가능 여부 확인
              const isSortable = sortableHeaderMap[header];
              
              return (
              <th 
                key={header} 
                  // 9. (NEW & THEME FIX) 정렬 가능 헤더에 클릭 스타일 및 이벤트 추가
                className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                    isSortable ? 'cursor-pointer hover:bg-gray-600 group' : ''
                  }`}
                  onClick={() => isSortable && onSort(header)}
              >
                  {/* 10. (NEW) 아이콘 표시를 위한 래퍼 추가 */}
                  <div className="flex items-center">
                    {header}
                    {/* 정렬 아이콘 표시 */}
                    {isSortable && (
                      <span className="ml-1 w-4">
                        {getSortIcon(header, sortConfig)}
                      </span>
                    )}
                  </div>
              </th>
            )})}
          </tr>
        </thead>
        {/* HYDRATION FIX: 
          </thead>와 <tbody> 사이, <tbody>와 {transactions.map...} 사이의
          모든 공백, 줄바꿈, JSX 주석을 제거했습니다.
        */}
        <tbody className="bg-gray-800 divide-y divide-gray-700">{transactions.map((transaction) => (
          // 12. (THEME FIX) 어두운 테마 적용
          <tr key={transaction.__rowIndex} className="hover:bg-gray-700">
            {displayHeaders.map(header => {
              const cellValue = transaction[header] || '-';
              
              // 현재 컬럼이 통화 컬럼인지 확인
              const isCurrency = currencyColumns.includes(header.trim());
              
              return (
                <td 
                  key={`${transaction.__rowIndex}-${header}`} 
                    // 13. (THEME FIX) 어두운 테마 적용 및 '-' 값 흐리게 처리
                  className={`px-6 py-3 whitespace-nowrap text-sm ${isCurrency ? 'text-right' : 'text-left'} ${
                      cellValue === '-' ? 'text-gray-500' : 'text-gray-200'
                    }`}
                >
                  {isCurrency ? formatAsUSD(cellValue) : cellValue}
                </td>
              );
            })}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}