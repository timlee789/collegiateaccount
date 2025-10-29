"use client";

import React from 'react';
// './AuthContext.jsx' 파일의 경로가 app/context/
// 폴더 기준으로 올바른지 확인해주세요.
// 만약 AuthContext.jsx가 context 폴더 안에 있다면 './AuthContext.jsx'가 맞습니다.
// .jsx 확장자를 제거하여 Next.js가 파일을 찾도록 수정합니다.
import { AuthProvider } from './AuthContext';

// 이 컴포넌트는 AuthProvider를 포함하는
// "use client" 컴포넌트입니다.
export function ClientProvider({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}


