'use client';

import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subYears, format, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Contribution {
  date: string;
  count: number;
  type: string;
}

interface UserStats {
  totalContributions: number;
  contributionsByType: {
    [key: string]: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  mostActiveDay: {
    date: string;
    count: number;
  };
}

interface UserContributionsProps {
  userId: string;
  contributions: Contribution[];
  userStats: UserStats;
}

export default function UserContributions({ userId, contributions, userStats }: UserContributionsProps) {
  const startDate = subYears(new Date(), 1);
  const endDate = new Date();

  const getTooltipDataAttrs = (value: any) => {
    if (!value || !value.date) {
      return null;
    }
    return {
      'data-tip': `${format(parseISO(value.date), 'MMM d, yyyy')}: ${
        value.count
      } contributions`,
    };
  };

  const activityByDayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activityByDay = days.map(day => ({
      day,
      count: contributions.filter(c => 
        new Date(c.date).getDay() === days.indexOf(day)
      ).reduce((sum, c) => sum + c.count, 0)
    }));

    return {
      labels: activityByDay.map(d => d.day),
      datasets: [
        {
          label: 'Contributions by Day',
          data: activityByDay.map(d => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  }, [contributions]);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Contributions
          </h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {userStats.totalContributions}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Current Streak
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {userStats.streaks.current} days
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Longest Streak
          </h3>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
            {userStats.streaks.longest} days
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Most Active Day
          </h3>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {format(parseISO(userStats.mostActiveDay.date), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {userStats.mostActiveDay.count} contributions
          </p>
        </div>
      </div>

      {/* Contribution Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contribution Activity
        </h3>
        <div className="contribution-calendar">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={contributions.map(c => ({
              date: c.date,
              count: c.count,
            }))}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              return `color-scale-${Math.min(Math.floor(value.count / 2), 4)}`;
            }}
            tooltipDataAttrs={getTooltipDataAttrs}
          />
        </div>
      </div>

      {/* Activity by Day of Week */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Activity by Day of Week
        </h3>
        <Bar
          data={activityByDayData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </div>

      {/* Contribution Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contribution Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(userStats.contributionsByType).map(([type, count]) => (
            <div key={type} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {type}
              </h4>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 