'use client';

import { useState, useMemo } from 'react';

// 자동 완성 드롭다운 컴포넌트
export default function AutocompleteInput({ name, placeholder, list, required = true }) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 입력 값에 따라 목록을 필터링합니다. (대소문자 구분 없이)
  const filteredList = useMemo(() => {
    if (!inputValue) {
      return list;
    }
    const lowerCaseInput = inputValue.toLowerCase();
    return list.filter(item => 
      item.toLowerCase().includes(lowerCaseInput)
    );
  }, [inputValue, list]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleItemClick = (item) => {
    setInputValue(item);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // 포커스 잃어도 0.2초 딜레이
        required={required}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      />

      {/* 필터링된 항목을 표시하는 드롭다운 */}
      {showDropdown && filteredList.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredList.map((item, index) => (
            <li
              key={index}
              onMouseDown={() => handleItemClick(item)} // onBlur보다 먼저 실행되도록 onMouseDown 사용
              className="px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}