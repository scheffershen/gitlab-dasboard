'use client';

import { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useRouter, useSearchParams } from 'next/navigation';

const timeRanges = [
  { id: '7', name: 'Last 7 days' },
  { id: '14', name: 'Last 14 days' },
  { id: '30', name: 'Last 30 days' },
  { id: '90', name: 'Last 90 days' },
];

interface FiltersProps {
  projects: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
}

export default function ActivityFilters({ projects, users }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState(
    timeRanges.find(range => range.id === searchParams.get('timeRange')) || timeRanges[0]
  );
  const [selectedProject, setSelectedProject] = useState(
    projects.find(project => project.id === searchParams.get('projectId')) || { id: 'all', name: 'All Projects' }
  );
  const [selectedUser, setSelectedUser] = useState(
    users.find(user => user.id === searchParams.get('userId')) || { id: 'all', name: 'All Users' }
  );

  const updateFilters = (type: string, value: any) => {
    const params = new URLSearchParams(searchParams);
    
    switch (type) {
      case 'timeRange':
        setSelectedTimeRange(value);
        params.set('timeRange', value.id);
        break;
      case 'project':
        setSelectedProject(value);
        params.set('projectId', value.id);
        break;
      case 'user':
        setSelectedUser(value);
        params.set('userId', value.id);
        break;
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      {/* Time Range Filter */}
      <div className="w-full sm:w-1/3">
        <Listbox value={selectedTimeRange} onChange={(value) => updateFilters('timeRange', value)}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span className="block truncate">{selectedTimeRange.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                {timeRanges.map((range) => (
                  <Listbox.Option
                    key={range.id}
                    value={range}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-100 dark:bg-indigo-600 text-indigo-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {range.name}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-300">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Project Filter */}
      <div className="w-full sm:w-1/3">
        <Listbox value={selectedProject} onChange={(value) => updateFilters('project', value)}>
          {/* Similar structure as Time Range Filter */}
        </Listbox>
      </div>

      {/* User Filter */}
      <div className="w-full sm:w-1/3">
        <Listbox value={selectedUser} onChange={(value) => updateFilters('user', value)}>
          {/* Similar structure as Time Range Filter */}
        </Listbox>
      </div>
    </div>
  );
} 