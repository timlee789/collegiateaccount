// app/lib/googleSheets.js

import { google } from 'googleapis';

// ⚠️ JSON.parse가 제대로 작동하는지 확인
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

// Google Sheets API 클라이언트를 인증하고 가져오는 함수
export async function getSheetsClient() {
  
  // 1. GoogleAuth 객체 생성 시 credentials와 scopes를 사용
  const auth = new google.auth.GoogleAuth({
    credentials,
    // Sheets API의 스코프(권한 범위)는 필수입니다.
    scopes: ['https://www.googleapis.com/auth/spreadsheets'], 
  });

  // 2. 인증된 클라이언트 획득
  const authClient = await auth.getClient();
  
  // 3. Sheets 클라이언트 생성 시 auth: authClient를 사용하여 인증 정보를 연결
  return google.sheets({ version: 'v4', auth: authClient });
}