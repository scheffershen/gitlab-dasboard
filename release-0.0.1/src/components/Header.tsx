'use client';

import { useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center flex-1 gap-4">
        </div>
      </div>
    </header>
  );
} 