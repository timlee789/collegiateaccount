"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
// lib/firebase.js에서 이미 초기화된 auth와 db를 가져옵니다.
// .js 확장자를 제거하여 경로 해석 문제를 수정합니다.
import { auth, db } from '../lib/firebase'; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
  // .env.local 파일에 NEXT_PUBLIC_APP_ID=collegiateaccount 와 같이 설정하는 것을 권장합니다.
  const appId = process.env.NEXT_PUBLIC_APP_ID || 'collegiateaccount';

  useEffect(() => {
    // lib/firebase.js에서 가져온 auth 객체를 사용
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      let currentUserId = null;
      if (user) {
        currentUserId = user.uid;
        
        // Firestore에서 사용자 정보 가져오기 시도
        const userDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}`);
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            // 사용자 문서가 없으면 생성
            await setDoc(userDocRef, { 
              email: user.email, 
              createdAt: new Date(),
              appId: appId
            });
          }
        } catch (error) {
          console.error("Firestore 사용자 문서 확인/생성 오류:", error);
        }
      }
      
      setUserId(currentUserId);
      setLoading(false); // 인증 상태 확인 완료
    });

    return () => unsubscribe(); // 클린업 함수
  }, [appId]); // appId가 변경될 때를 대비 (보통 변경되지 않음)

  const value = {
    currentUser,
    userId,
    loading,
    auth, // NavBar에서 로그아웃 시 사용할 auth 객체 전달
    db,   // 페이지 컴포넌트에서 사용할 db 객체 전달
    appId // 앱 ID 전달
  };

  // 인증 로딩이 완료된 후에만 자식 컴포넌트들을 렌더링
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


