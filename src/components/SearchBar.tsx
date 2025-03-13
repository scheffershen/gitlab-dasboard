'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'project' | 'user' | 'activity';
  title: string;
  subtitle?: string;
  url: string;
  avatar_url?: string;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/gitlab/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    router.push(result.url);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          className="h-12 w-full rounded-lg border border-gray-200 pl-11 pr-4 text-sm text-gray-800 
                   placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 
                   focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          placeholder="Search projects, users, or activities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {isLoading && (
          <div className="absolute right-4 top-3.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute mt-2 w-full rounded-lg border border-gray-200 bg-white py-2 shadow-lg 
                      dark:border-gray-700 dark:bg-gray-800">
          {results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleResultClick(result)}
                    className="flex w-full items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {result.avatar_url && (
                      <img
                        src={result.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {result.subtitle}
                        </p>
                      )}
                      <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {result.type}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No results found
            </p>
          )}
        </div>
      )}
    </div>
  );
} 