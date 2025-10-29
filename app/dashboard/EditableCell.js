'use client';

import { useState } from 'react';
import { updateCell } from '../actions/accounting'; // Server Action import

// 편집 가능한 셀 컴포넌트
export default function EditableCell({ initialValue, rowIndex, columnName }) {
    const [value, setValue] = useState(initialValue || '');
    const [isEditing, setIsEditing] = useState(false);
    const [status, setStatus] = useState(null); // 'saving', 'saved', 'error'

    // 입력 필드 포커스를 잃었을 때 (onBlur) 데이터를 저장합니다.
    const handleBlur = async () => {
        setIsEditing(false);
        
        // 값이 변경되지 않았으면 저장하지 않습니다.
        if (value === initialValue || status === 'saving') {
            return;
        }

        setStatus('saving');
        
        const result = await updateCell(rowIndex, columnName, value);

        if (result.success) {
            setStatus('saved');
            // 2초 후 메시지 제거
            setTimeout(() => setStatus(null), 2000); 
        } else {
            setStatus('error');
            console.error(result.message);
            // 에러 시 텍스트는 유지하고 색상만 변경
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Enter 키를 누르면 onBlur 이벤트 트리거
        }
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'saving':
                return <span className="ml-2 text-sm text-yellow-500">저장 중...</span>;
            case 'saved':
                return <span className="ml-2 text-sm text-green-500">저장 완료!</span>;
            case 'error':
                return <span className="ml-2 text-sm text-red-500">오류!</span>;
            default:
                return null;
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full p-1 border border-indigo-500 rounded text-sm bg-indigo-50"
                />
                {getStatusIndicator()}
            </div>
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className="w-full p-1 cursor-pointer hover:bg-gray-100 rounded min-h-[30px]"
        >
            {initialValue}
        </div>
    );
}
