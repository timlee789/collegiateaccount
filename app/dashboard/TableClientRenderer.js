'use client';

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
 */
export default function TableClientRenderer({ transactions, headers }) {
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 bg-white shadow-xl rounded-lg">
        거래 내역이 없습니다.
      </div>
    );
  }

  // __rowIndex를 제외한 헤더만 표시
  const displayHeaders = headers.filter(h => h !== '__rowIndex');
  
  // 통화 형식을 적용할 컬럼 목록 (Google Sheets 헤더와 일치해야 함)
  const currencyColumns = ['Amount', 'CASH', 'TOTAL'];

  return (
    <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {displayHeaders.map(header => (
              <th 
                key={header} 
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.__rowIndex} className="hover:bg-gray-50">
              {displayHeaders.map(header => {
                const cellValue = transaction[header] || '-';
                
                // 현재 컬럼이 통화 컬럼인지 확인
                const isCurrency = currencyColumns.includes(header.trim());
                
                return (
                  <td 
                    key={`${transaction.__rowIndex}-${header}`} 
                    // 통화 컬럼은 오른쪽 정렬, 나머지는 왼쪽 정렬
                    className={`px-6 py-3 whitespace-nowrap text-sm text-gray-900 ${isCurrency ? 'text-right' : 'text-left'}`}
                  >
                    {isCurrency ? formatAsUSD(cellValue) : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

