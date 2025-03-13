import ActivityFilters from '@/components/ActivityFilters';
import ActivityList from '@/components/ActivityList';
import ActivityStats from '@/components/ActivityStats';
import ActivityChart from '@/components/ActivityChart';
import { getGitlabData } from '@/lib/gitlab';
import { Suspense } from 'react';

// Loading component for better UX
function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [activities, projects, users] = await Promise.all([
    getGitlabData('events', searchParams),
    getGitlabData('projects'),
    getGitlabData('users')
  ]);

  const stats = [
    {
      name: 'Total Commits',
      value: activities.filter((a: { action_name: string }) => a.action_name === 'pushed').length,
      change: 12,
      changeType: 'increase' as const,
    },
    {
      name: 'Active Projects',
      value: projects.length,
      change: 2,
      changeType: 'increase' as const,
    },
    {
      name: 'Contributors',
      value: users.length,
      change: 0,
      changeType: 'neutral' as const,
    },
    {
      name: 'Recent Activities',
      value: activities.length,
      change: 5,
      changeType: 'increase' as const,
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filters
          </h2>
          <Suspense fallback={<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <ActivityFilters projects={projects} users={users} />
          </Suspense>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Suspense fallback={<LoadingState />}>
            <ActivityStats stats={stats} />
          </Suspense>
        </div>

        {/* Activity Chart */}
        {/*<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Suspense fallback={<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <ActivityChart data={activities} />
          </Suspense>
        </div>*/}

        {/* Recent Activity List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <Suspense fallback={<LoadingState />}>
              <ActivityList activities={activities} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 