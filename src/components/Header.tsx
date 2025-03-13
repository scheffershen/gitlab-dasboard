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
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 gap-4">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Dashboard
            </h1>
            <SearchBar />
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-gray-800 dark:text-white" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-800 dark:text-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
} 