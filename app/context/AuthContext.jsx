"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
// lib/firebase.js에서 auth만 가져옵니다.
// ⛔️ db를 import에서 제거
import { auth } from '@/app/lib/firebase'; // 👈 경로 수정
import { onAuthStateChanged } from "firebase/auth";
// ⛔️ Firestore 관련 import 제거
// import { doc, getDoc, setDoc } from "firebase/firestore";

// AuthContext 생성
const AuthContext = createContext();

// useAuth 훅 정의
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  // 앱 ID 정의 (환경 변수 또는 하드코딩)
  const appId = process.env.NEXT_PUBLIC_APP_ID || 'collegiateaccount';

  useEffect(() => {
    // lib/firebase.js에서 가져온 auth 객체를 사용
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      let currentUserId = null;
      if (user) {
        currentUserId = user.uid;
        
        // ⛔️ Firestore 사용자 문서 확인/생성 로직 모두 제거
      }
      
      setUserId(currentUserId);
      setLoading(false); // 인증 상태 확인 완료
    });

    return () => unsubscribe(); // 클린업 함수
  }, []); // ⛔️ appId dependency 제거 (Firestore 로직이 없으므로 불필요)

  const value = {
    currentUser,
    userId,
    loading,
    auth, // NavBar에서 로그아웃 시 사용할 auth 객체 전달
    // ⛔️ db 객체 전달 제거
    appId // 앱 ID 전달
  };

  // 인증 로딩이 완료된 후에만 자식 컴포넌트들을 렌더링
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


