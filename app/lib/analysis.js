// app/actions/accounting.js 파일에 추가하거나, 분석 전용 파일로 분리합니다.

// 월별/연도별 데이터를 요약하는 함수 (예시)
export async function getFinancialSummary() {
    'use server';
    
    // 1. 모든 거래 내역 데이터를 가져옵니다.
    const { data: transactions, headers, error } = await getAccountingData();

    if (error || transactions.length === 0) {
        return { summary: {}, error: error || '거래 내역이 없습니다.' };
    }

    // 2. 데이터를 분석하기 쉽게 구조화합니다.
    const mappedTransactions = transactions.map(row => {
        // headers 배열을 사용하여 객체로 변환하는 기존 로직이 있다고 가정합니다.
        // 여기서는 Google Sheet의 컬럼 이름(Date, Type, Amount)을 직접 사용합니다.
        
        const transaction = {};
        // Google Sheet의 헤더 순서에 따라 적절한 인덱스를 사용하세요. 
        // 예시로 'Type'이 4번째 열, 'Amount'가 6번째 열에 있다고 가정합니다.
        transaction.date = row[0]; // Date
        transaction.type = row[4]; // Type (Income/Expense)
        transaction.amount = parseFloat(row[6]) || 0; // Amount
        transaction.month = row[9]; // MONTH 컬럼 (Sheet에서 자동 계산되는 경우)
        
        // MONTH 컬럼을 사용하지 않는 경우:
        const dateObj = new Date(row[0]);
        if (!isNaN(dateObj)) {
            transaction.yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        } else {
             transaction.yearMonth = 'Invalid Date';
        }
        
        return transaction;
    }).filter(t => t.yearMonth !== 'Invalid Date');

    // 3. 월별 총 수입, 지출, 순이익을 계산합니다.
    const monthlySummary = mappedTransactions.reduce((acc, t) => {
        const month = t.yearMonth;
        if (!acc[month]) {
            acc[month] = { revenue: 0, expense: 0, net: 0 };
        }
        
        if (t.type === 'Income') {
            acc[month].revenue += t.amount;
        } else if (t.type === 'Expense') {
            acc[month].expense += t.amount;
        }
        acc[month].net = acc[month].revenue - acc[month].expense;
        
        return acc;
    }, {});

    // 4. 전체 요약 (Total Revenue, Expense, Net Income)
    const totalSummary = {
        totalRevenue: mappedTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
        totalExpense: mappedTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    };
    totalSummary.netIncome = totalSummary.totalRevenue - totalSummary.totalExpense;

    return { 
        summary: { monthlySummary, totalSummary }, 
        error: null 
    };
}