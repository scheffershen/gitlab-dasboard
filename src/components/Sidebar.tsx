'use client';

import { HomeIcon, ChartBarIcon, UsersIcon, CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Activity', href: '/dashboard/activity', icon: ChartBarIcon },
  { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="h-full flex flex-col">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
          <img
            className="h-8 w-auto"
            src="/gitlab-logo.svg"
            alt="GitLab Logo"
          />
          <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
            GitLab
          </span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-400'
                  } mr-3 flex-shrink-0 h-5 w-5`}
                /> 
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 