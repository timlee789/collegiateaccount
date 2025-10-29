"use client"; // For using usePathname hook

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook to detect current page
// Firebase Auth 훅과 로그아웃 기능을 import 합니다.
// 경로를 @/ 별칭 대신 상대 경로로 수정합니다.
import { useAuth } from '../context/AuthContext.jsx'; // Clerk 대신 AuthContext 사용
import { signOut } from 'firebase/auth'; // Firebase 로그아웃 함수

export default function NavBar() {
  const pathname = usePathname(); // Get current URL path
  // useAuth 훅을 사용하여 현재 사용자 정보와 auth 객체를 가져옵니다.
  const { currentUser, loading, auth } = useAuth();

  // Define navigation links (protected routes)
  const links = [
    { href: '/dashboard', label: '전체 보기' },
    { href: '/report', label: '월별 Report' },
    { href: '/report-detail', label: '월별 Detail' },
    { href: '/sales-report', label: 'Sales Report' },
  ];

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        // 로그아웃 후 홈으로 리디렉션 (필요시)
        // Next.js 13+에서는 router.push('/')를 사용해야 할 수도 있습니다.
        // 여기서는 간단히 로그아웃만 처리합니다.
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
    }
  };

  return (
    <nav className="bg-indigo-600 p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* App Title/Home Link */}
        <Link href="/" className="text-xl font-bold text-white hover:text-indigo-200">
          회계 앱
        </Link>

        {/* Navigation Links and Auth Buttons */}
        <div className="flex items-center space-x-4">
          {/* Show protected links only when signed in (Firebase) */}
          {/* 로딩이 끝나고 사용자가 있을 때 링크를 보여줍니다. */}
          {!loading && currentUser && (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-white font-medium px-3 py-2 rounded-md transition duration-150 ease-in-out ${
                    pathname === link.href
                      ? 'bg-indigo-700'
                      : 'hover:bg-indigo-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}

          {/* Show Log In button when signed out (Firebase) */}
          {/* 로딩이 끝나고 사용자가 없을 때 로그인 버튼을 보여줍니다. */}
          {!loading && !currentUser && (
            <Link
              href="/sign-in" // Link to the sign-in page
              className="text-white font-medium px-3 py-2 rounded-md transition duration-150 ease-in-out bg-green-600 hover:bg-green-700" // Styled as a button
            >
              Log In
            </Link>
          )}

          {/* Show Logout button when signed in (Firebase) */}
          {/* <UserButton> 대신 간단한 로그아웃 버튼으로 대체합니다. */}
          {!loading && currentUser && (
            <button
              onClick={handleLogout}
              className="text-white font-medium px-3 py-2 rounded-md transition duration-150 ease-in-out bg-red-600 hover:bg-red-700"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

