'use client';

import { useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ProjectStatsProps {
  projectData: {
    id: string;
    name: string;
    commits_count: number;
    last_activity_at: string;
    contributors: Array<{
      name: string;
      commits: number;
    }>;
    languages: {
      [key: string]: number;
    };
  }[];
}

export default function ProjectStats({ projectData }: ProjectStatsProps) {
  const getTopProjects = useCallback(() => {
    return projectData
      .sort((a, b) => b.commits_count - a.commits_count)
      .slice(0, 5);
  }, [projectData]);

  const getLanguageStats = useCallback(() => {
    const languages: { [key: string]: number } = {};
    projectData.forEach(project => {
      Object.entries(project.languages).forEach(([lang, bytes]) => {
        languages[lang] = (languages[lang] || 0) + bytes;
      });
    });
    return languages;
  }, [projectData]);

  const commitsChartData = useMemo(() => ({
    labels: getTopProjects().map(p => p.name),
    datasets: [
      {
        label: 'Total Commits',
        data: getTopProjects().map(p => p.commits_count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }), [getTopProjects]);

  const languagesChartData = useMemo(() => {
    const languages = getLanguageStats();
    const colors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
    ];

    return {
      labels: Object.keys(languages),
      datasets: [
        {
          data: Object.values(languages),
          backgroundColor: colors.slice(0, Object.keys(languages).length),
          borderWidth: 1,
        },
      ],
    };
  }, [getLanguageStats]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Total Projects
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {projectData.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Total Commits
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {projectData.reduce((sum, project) => sum + project.commits_count, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {projectData.filter(p => new Date(p.last_activity_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Projects by Commits
          </h3>
          <Bar
            data={commitsChartData}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Languages Distribution
          </h3>
          <Doughnut
            data={languagesChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right' as const,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Details
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commits
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Top Contributor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projectData.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {project.commits_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(project.last_activity_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {project.contributors[0]?.name || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 