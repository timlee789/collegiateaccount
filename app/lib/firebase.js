// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// ⛔️ Firestore 관련 import 제거
// import { getFirestore, setLogLevel } from "firebase/firestore";

// Your web app's Firebase configuration
// !! 키를 직접 하드코딩하는 대신, 환경 변수에서 읽어옵니다.
// !! Next.js에서 브라우저에 노출할 환경 변수는 "NEXT_PUBLIC_" 접두사가 필수입니다.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// Next.js 환경에서 중복 초기화를 방지합니다.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics는 클라이언트 사이드에서만 초기화합니다.
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Auth 객체만 생성합니다.
const auth = getAuth(app);

// ⛔️ Firestore 객체 생성 코드 제거
// const db = getFirestore(app);

// ⛔️ Firestore 디버그 로그 제거
// setLogLevel('Debug');

// ⛔️ db를 export에서 제거
// 생성된 객체들을 export 합니다.
export { app, auth, analytics };

