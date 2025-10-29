'use server';

import { getSheetsClient } from '../lib/googleSheets';
import { revalidatePath } from 'next/cache';

const spreadsheetId = process.env.GOOGLE_SHEET_ID;

/**
 * 재시도 로직을 포함한 API 호출 래퍼
 */
async function fetchWithRetry(apiCall, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await apiCall();
            // console.log("API 호출 성공"); // 성공 시 로그 (디버깅용)
            return response;
        } catch (error) {
            if (error.code === 429 && retries < maxRetries - 1) { // 할당량 초과 오류이고 재시도 횟수 남음
                retries++;
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000; // 지수 백오프 + Jitter
                console.warn(`API 호출 실패 (코드 ${error.code}). ${delay / 1000}초 후 재시도... (${retries}/${maxRetries - 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`API 호출 최종 실패 (코드 ${error.code}):`, error.message);
                throw error; // 재시도 불가 또는 최대 재시도 도달 시 오류 발생
            }
        }
    }
    // 이론상 도달하지 않지만, 만약을 위해 오류 발생
    throw new Error('최대 재시도 횟수를 초과했습니다.');
}


// =======================================================
// 데이터 읽기 함수 (리트라이 포함)
// =======================================================
export async function getAccountingData() {
    try {
        const sheetsClient = await getSheetsClient();

        const response = await fetchWithRetry(() =>
            sheetsClient.spreadsheets.values.get({
                spreadsheetId,
                range: 'Expense!A:K',
            })
        );

        const rows = response.data.values || [];
        const headers = rows[0] || [];

        // 데이터만 추출하며, 각 행에 고유한 '__rowIndex'를 추가합니다.
        const data = rows.slice(1).map((row, index) => {
            const rowObject = {
                __rowIndex: index + 2 // 실제 Sheets 행 번호
            };
            headers.forEach((header, colIndex) => {
                rowObject[header] = row[colIndex];
            });
            return rowObject;
        });
        // console.log("Expense data fetched successfully."); // 디버깅용 로그
        return { data, headers: headers, error: null }; // __rowIndex는 data 객체 안에 포함됨

    } catch (error) {
        // console.error('Error fetching data:', error); // fetchWithRetry 내부에서 로깅
        return { data: [], headers: [], error: `데이터 로드 실패: ${error.message}` };
    }
}

// =======================================================
// 드롭다운 목록 가져오기 함수 (batchGet 및 리트라이 포함)
// =======================================================
export async function getDropdownData() {
    const ranges = ['Categories!A:A', 'Payees!A:A', 'Divs!A:A', 'Types!A:A'];
    try {
        const sheetsClient = await getSheetsClient();

        // batchGet API 호출 (단 1회)
        const response = await fetchWithRetry(() =>
            sheetsClient.spreadsheets.values.batchGet({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                ranges: ranges,
            })
        );

        const valueRanges = response.data.valueRanges || [];

        // 각 범위의 데이터를 추출하고 평탄화
        const getData = (index) => (valueRanges[index]?.values || []).flat().filter(Boolean);

        const categories = getData(0);
        const payees = getData(1);
        const divs = getData(2);
        const types = getData(3);

        // console.log("Dropdown data fetched successfully."); // 디버깅용 로그
        return { categories, payees, divs, types, error: null };

    } catch (error) {
        // console.error('Error fetching dropdown data:', error); // fetchWithRetry 내부에서 로깅
        return { categories: [], payees: [], divs: [], types: [], error: `드롭다운 목록 로드 실패: ${error.message}` };
    }
}


// =======================================================
// 재무 요약 및 분석 함수 (getFinancialSummary) - console.log 제거됨
// =======================================================
export async function getFinancialSummary() {
    'use server';

    // 1. 모든 거래 내역 데이터를 가져옵니다. (결과는 객체 배열)
    const { data: transactions, error } = await getAccountingData();

    if (error) {
        return { summary: {}, error };
    }

    if (!transactions || transactions.length === 0) {
        return { summary: {}, error: '거래 내역이 없습니다.' };
    }

    // 2. 데이터를 분석하기 쉽게 구조화 및 매핑합니다.
    const mappedTransactions = transactions.map(t => {
        const dateString = t.Date;
        const div = t.Div; // 'Expense' 또는 'Income' 확인
        const category = t.Category;
        // Amount 문자열에서 숫자만 추출하여 변환
        const amountStr = String(t.Amount).replace(/[^0-9.-]+/g, '');
        const amount = parseFloat(amountStr) || 0;

        const transaction = { date: dateString, div, category, amount };

        // 월별 분석을 위한 Year-Month 생성
        const dateObj = new Date(dateString);
        if (dateString && !isNaN(dateObj)) {
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

        if (t.div === 'Income') { // t.Type 대신 t.Div 사용
            acc[month].revenue += t.amount;
        } else if (t.div === 'Expense') { // t.Type 대신 t.Div 사용
            acc[month].expense += t.amount;
        }
        acc[month].net = acc[month].revenue - acc[month].expense;

        return acc;
    }, {});

    // 4. 전체 요약 (Total Revenue, Expense, Net Income)
    const totalSummary = {
        totalRevenue: mappedTransactions.filter(t => t.div === 'Income').reduce((sum, t) => sum + t.amount, 0),
        totalExpense: mappedTransactions.filter(t => t.div === 'Expense').reduce((sum, t) => sum + t.amount, 0),
    };
    totalSummary.netIncome = totalSummary.totalRevenue - totalSummary.totalExpense;

    // 5. 월별 & 카테고리별 합계를 계산
    const categorySummary = {};
    mappedTransactions.forEach(t => {
        if (t.div === 'Expense') { // 지출만 분석
            const month = t.yearMonth;
            const category = t.category || '기타'; // 카테고리가 없는 경우

            if (!categorySummary[month]) {
                categorySummary[month] = {};
            }
            // 해당 카테고리에 금액 누적
            categorySummary[month][category] = (categorySummary[month][category] || 0) + t.amount;
        }
    });

    return {
        summary: { monthlySummary, totalSummary, categorySummary },
        error: null
    };
}


// =======================================================
// Sales 데이터 읽기 함수 (리트라이 포함)
// =======================================================
export async function getSalesData() {
    try {
        const sheetsClient = await getSheetsClient();

        // Assuming Sales sheet name is 'Sales' and data is in A:I range
        const response = await fetchWithRetry(() =>
            sheetsClient.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Sales!A:I', // Date, Cash, Card, Deposit, SVC, Tips, Tax, C-Tips, Total
            })
        );

        const rows = response.data.values || [];
        const headers = rows[0] || [];

        const data = rows.slice(1).map((row) => {
            const rowObject = {};
            headers.forEach((header, colIndex) => {
                rowObject[header] = row[colIndex];
            });
             // Add MONTH for filtering later
            const dateObj = new Date(rowObject.Date);
            if (rowObject.Date && !isNaN(dateObj)) {
                rowObject.MONTH = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            } else {
                 rowObject.MONTH = 'Invalid Date';
            }
            return rowObject;
        });

        // console.log("Sales data fetched successfully."); // 디버깅용 로그
        return { data, headers: headers, error: null };

    } catch (error) {
        // console.error('Error fetching sales data:', error); // fetchWithRetry 내부에서 로깅
        return { data: [], headers: [], error: `Sales 데이터 로드 실패: ${error.message}` };
    }
}

