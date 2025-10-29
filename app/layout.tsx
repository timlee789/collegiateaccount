import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Clerk Provider 대신 ClientProvider를 import 합니다.
// (NavBar와 동일한 상대 경로 스타일을 따릅니다)
import { ClientProvider } from './context/ClientProvider';
// NavBar import
import NavBar from './components/NavBar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collegiate", // 앱 제목 설정
  description: "Google Sheets 기반 회계 대시보드",
};

// RootLayout 함수의 props 타입 정의
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // <html> 태그가 최상위에 있어야 합니다.
    <html lang="ko">
      {/* <body> 태그에 직접 배경색 클래스 추가 */}
      <body className={`${inter.className} bg-gray-900`}>
        {/* ClientProvider가 body 내부의 콘텐츠를 감싸도록 수정 */}
        <ClientProvider>
          <NavBar /> {/* NavBar 렌더링 (한 번만) */}
          <main>{children}</main> {/* 페이지 콘텐츠 렌더링 */}
        </ClientProvider>
      </body>
    </html>
  );
}

