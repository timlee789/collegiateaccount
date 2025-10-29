// 이 파일은 이제 입력 기능 대신 대시보드로 리디렉션하는 역할을 합니다.
import { redirect } from 'next/navigation';

// 서버 컴포넌트에서 /dashboard 경로로 즉시 리디렉션합니다.
export default function InputPage() {
    // 사용자가 거래 입력을 위해 이 페이지에 접근하면, 대시보드로 이동시킵니다.
    redirect('/dashboard');
    return null; 
}
