"use client";

// import { useAuth } from '../context/AuthContext'; // 이전 상대 경로
import { useAuth } from '../context/AuthContext'; // Next.js 경로 별칭으로 수정
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// 이 컴포넌트로 감싸진 페이지는 로그인이 필요하게 됩니다.
export default function ProtectedPage({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 인증 상태 로딩이 끝났는지 확인
    if (!loading) {
      // 로딩이 끝났는데, 로그인한 사용자가 없으면
      if (!currentUser) {
        // 로그인 페이지로 강제 리디렉션
        router.push('/sign-in');
      }
    }
  }, [currentUser, loading, router]); // currentUser, loading 상태가 변경될 때마다 실행

  // 1. 로딩 중이거나
  // 2. 로그인한 사용자가 없어서 리디렉션이 실행될 경우
  //    (리디렉션이 완료되기 전에 페이지 내용이 잠깐 보이는 것을 방지)
  if (loading || !currentUser) {
    // 로딩 인디케이터를 보여줍니다.
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-lg">Loading...</p>
        {/* 또는 여기에 스피너 컴포넌트를 넣어도 됩니다. */}
      </div>
    );
  }

  // 로딩이 완료되었고, 로그인한 사용자가 있으면
  // 자식 컴포넌트(실제 페이지 내용)를 렌더링합니다.
  return children;
}

