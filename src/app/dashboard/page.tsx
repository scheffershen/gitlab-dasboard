'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import CommitModal from '@/components/CommitModal';

const PERIOD_OPTIONS = [
  { label: '24 hours', value: '1' },
  { label: '7 days', value: '7', default: true },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '3 months', value: '90' },
  { label: '6 months', value: '180' },
];

interface Project {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
}

interface Stats {
  total_commits: number;
  total_contributors: number;
  additions: number;
  deletions: number;
}

interface EventsData {
  events: any[];
  timestamp: string;
}

// Helper function to format date in YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function Page() {
  const [period, setPeriod] = useState('7');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedDeveloper, setSelectedDeveloper] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<{projectId: string, commitId: string} | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const [projectsResponse, developersResponse] = await Promise.all([
          api.get('/api/v4/projects', {
            params: { membership: true, per_page: 100 }
          }),
          api.get('/api/v4/users', {
            params: { active: true, per_page: 100 }
          })
        ]);

        const sortedProjects = projectsResponse.data
          .map((p: any) => ({ id: p.id, name: p.name }))
          .sort((a: Project, b: Project) => a.name.localeCompare(b.name));

        const sortedDevelopers = developersResponse.data
          .map((d: any) => ({ id: d.id, name: d.name }))
          .sort((a: Developer, b: Developer) => a.name.localeCompare(b.name));

        setProjects(sortedProjects);
        setDevelopers(sortedDevelopers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      const periodDays = parseInt(period);
      startDate.setDate(startDate.getDate() - periodDays);
      endDate.setDate(endDate.getDate() + 1); // Add 1 day to include today's commits

      if (selectedProject === 'all' && selectedDeveloper === 'all') {
        // Use events API for all projects and all users
        // GET /events?action=pushed&after=2025-03-08&before=2025-03-15&scope=all
        const eventsResponse = await api.get('/api/v4/events', {
          params: {
            after: formatDate(startDate),
            before: formatDate(endDate),
            action: 'pushed',
            scope: 'all',
            per_page: 100
          }
        });

        const events = eventsResponse.data;
        
        // Store raw events data
        setEventsData({
          events,
          timestamp: new Date().toISOString()
        });

        // Calculate stats from events
        const commits = events.reduce((acc: number, event: any) => {
          return acc + (event.push_data?.commit_count || 0);
        }, 0);

        const contributors = new Set(events.map((event: any) => event.author_username));

        setStats({
          total_commits: commits,
          total_contributors: contributors.size,
          additions: 0, // Events API doesn't provide line changes
          deletions: 0  // Events API doesn't provide line changes
        });

      } else if (selectedProject !== 'all') {
        // Use project commits API for specific project
        const projectEndpoint = `/api/v4/projects/${selectedProject}/repository/commits`;
        const params: any = {
          since: startDate.toISOString(),
          until: endDate.toISOString(),
        };

        if (selectedDeveloper !== 'all') {
          params.author_id = selectedDeveloper;
        }

        const commitsResponse = await api.get(projectEndpoint, { params });
        const commits = commitsResponse.data;
        const contributors = new Set(commits.map((c: any) => c.author_name));
        
        let additions = 0;
        let deletions = 0;

        await Promise.all(commits.map(async (commit: any) => {
          const detailResponse = await api.get(`/api/v4/projects/${selectedProject}/repository/commits/${commit.id}`);
          additions += detailResponse.data.stats?.additions || 0;
          deletions += detailResponse.data.stats?.deletions || 0;
        }));

        setStats({
          total_commits: commits.length,
          total_contributors: contributors.size,
          additions,
          deletions
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Advanced Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="all">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Developer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Developer
              </label>
              <select
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="all">All developers</option>
                {developers.map((developer) => (
                  <option key={developer.id} value={developer.id}>
                    {developer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Update Data
              </button>
            </div>
          </div>
        </div>
      
        {/* Stats Display */}
        <div className="mt-6">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : stats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Commits</h3>
                  <p className="mt-1 text-2xl font-semibold">{stats.total_commits}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contributors</h3>
                  <p className="mt-1 text-2xl font-semibold">{stats.total_contributors}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lines Added</h3>
                  <p className="mt-1 text-2xl font-semibold text-green-600">{stats.additions}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lines Deleted</h3>
                  <p className="mt-1 text-2xl font-semibold text-red-600">{stats.deletions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commits Table */}
        {eventsData && eventsData.events.length > 0 && (
          <div className="space-y-6">
            {Object.entries(
              eventsData.events.reduce((acc, event) => {
                const commitDate = new Date(event.created_at);
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                let dateLabel;
                if (
                  commitDate.getDate() === today.getDate() &&
                  commitDate.getMonth() === today.getMonth() &&
                  commitDate.getFullYear() === today.getFullYear()
                ) {
                  dateLabel = 'Today';
                } else if (
                  commitDate.getDate() === yesterday.getDate() &&
                  commitDate.getMonth() === yesterday.getMonth() &&
                  commitDate.getFullYear() === yesterday.getFullYear()
                ) {
                  dateLabel = 'Yesterday';
                } else {
                  dateLabel = commitDate.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                }

                if (!acc[dateLabel]) acc[dateLabel] = [];
                acc[dateLabel].push(event);
                return acc;
              }, {} as Record<string, typeof eventsData.events>)
            ).map(([date, dayEvents]) => (
              <div key={date} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {date}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">
                          Project
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Author
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Time
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dayEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                              {projects.find(p => p.id === event.project_id)?.name || `Project ID: ${event.project_id}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {event.author.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.created_at).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedCommit({
                                projectId: event.project_id.toString(),
                                commitId: event.push_data.commit_to
                              })}
                              className="text-blue-500 hover:underline text-sm"
                            >
                              View Changes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Add CommitModal component */}
            <CommitModal
              isOpen={!!selectedCommit}
              onClose={() => setSelectedCommit(null)}
              projectId={selectedCommit?.projectId || ''}
              commitId={selectedCommit?.commitId || ''}
            />
          </div>
        )}
      </div>

      {/* can you show the commits in a table?*/}
      {/* Debug Buttons */}
      <div className="mt-8 space-x-4 flex">
        <button
          onClick={() => setShowJsonModal(true)}
          className="text-blue-500 hover:underline text-sm"
        >
          View Stats JSON Data
        </button>
        <button
          onClick={() => setShowEventsModal(true)}
          className="text-blue-500 hover:underline text-sm"
          disabled={!eventsData}
        >
          View Events API Data
        </button>
      </div>

      {/* Existing Stats JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Raw JSON Data</h2>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="text-sm">
                {JSON.stringify({
                  filters: {
                    period,
                    selectedProject,
                    selectedDeveloper
                  },
                  stats,
                  projects,
                  developers
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Events API JSON Modal */}
      {showEventsModal && eventsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold">Events API Raw Data</h2>
                <p className="text-sm text-gray-500">
                Fetched at: {new Date(eventsData.timestamp).toLocaleString('en-US', {
                    timeZone: 'UTC',
                    dateStyle: 'short',
                    timeStyle: 'medium'
                  })} UTC
                </p>
              </div>
              <button
                onClick={() => setShowEventsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="text-sm">
                {JSON.stringify(eventsData.events, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 