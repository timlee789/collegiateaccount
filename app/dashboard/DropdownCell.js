'use client';

import { useState, useMemo } from 'react';
// import { updateCell } from '@/app/actions/accounting'; // ⚠️ Sheets 저장 액션은 미구현 상태입니다.

// 드롭다운 편집을 위한 클라이언트 컴포넌트
export default function DropdownCell({ initialValue, rowIndex, columnName, dropdownLists }) {
    
    const [currentValue, setCurrentValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);

    // 컬럼 이름에 따라 사용할 드롭다운 목록을 결정
    const list = useMemo(() => {
        switch(columnName) {
            case 'Category': return dropdownLists.categories || [];
            case 'Payee': return dropdownLists.payees || [];
            case 'Div': return dropdownLists.divs || []; 
            case 'Type': return dropdownLists.types || [];
            default: return []; // 목록이 없는 경우 빈 배열 반환
        }
    }, [columnName, dropdownLists]);

    // 값 변경 핸들러
    const handleChange = async (event) => {
        const newValue = event.target.value;
        
        // 1. UI 값 즉시 업데이트
        setCurrentValue(newValue);
        setIsSaving(true);
        
        // 2. 서버 액션을 호출하여 Google Sheets에 반영 (현재는 콘솔 로그)
        console.log(`Dropdown Save: Row ${rowIndex}, Col ${columnName}, New Value: ${newValue}`);
        
        // ⚠️ 실제 Sheets 업데이트 로직 (주석 처리됨):
        /*
        try {
            // await updateCell(rowIndex, columnName, newValue);
            console.log(`Successfully updated Row ${rowIndex}, Col ${columnName}`);
        } catch (error) {
            console.error('Failed to save cell:', error);
            // 실패 시 사용자에게 알림 또는 이전 값으로 롤백
        } finally {
            setIsSaving(false);
        }
        */
        
        // 임시로 1초 후 저장 완료 처리
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="relative">
            <select
                value={currentValue}
                onChange={handleChange}
                // 너비 확보 및 가독성 개선 클래스
                className="w-full p-1 border border-indigo-300 rounded text-sm bg-white text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 appearance-none" 
                style={{ minWidth: '100px' }} // 최소 너비 강제 설정
            >
                {/* 현재 값이 목록에 없는 경우를 대비하여 기본 옵션 추가 */}
                {list.length === 0 && <option value={currentValue}>{currentValue} (목록 없음)</option>}
                
                {/* 목록 옵션 렌더링 */}
                {list.map(item => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
            {/* 저장 중 인디케이터 */}
            {isSaving && (
                <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-indigo-500 animate-pulse">
                    저장 중...
                </span>
            )}
        </div>
    );
}
