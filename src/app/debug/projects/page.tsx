'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import Link from 'next/link';
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
import { Pie } from 'react-chartjs-2';

interface Project {
  id: number;
  name: string;
  commits_count: number;
  last_activity_at: string;
  contributors: { name: string; commits: number }[];
  languages: Record<string, number>;
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DebugPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getProjectStats(api: AxiosInstance) {
    // Get total number of projects first
    const initialResponse = await api.get('/api/v4/projects', {
      params: {
        membership: true,
        per_page: 1
      }
    });

    const totalProjects = parseInt(initialResponse.headers['x-total']);
    const totalPages = Math.ceil(totalProjects / 100);
    let allProjects = [];

    // Fetch all pages
    for (let page = 1; page <= totalPages; page++) {
      const projectsResponse = await api.get('/api/v4/projects', {
        params: {
          membership: true,
          per_page: 100,
          page,
          statistics: true
        }
      });
      allProjects = [...allProjects, ...projectsResponse.data];
    }

    // Process projects with languages and contributors
    return Promise.all(allProjects.map(async (project: any) => {
      const [languagesResponse, contributorsResponse] = await Promise.all([
        api.get(`/api/v4/projects/${project.id}/languages`),
        api.get(`/api/v4/projects/${project.id}/repository/contributors`)
      ]);

      return {
        id: project.id,
        name: project.name,
        commits_count: project.statistics?.commit_count || 0,
        last_activity_at: project.last_activity_at,
        contributors: contributorsResponse.data.map((c: any) => ({
          name: c.name,
          commits: c.commits
        })),
        languages: languagesResponse.data
      };
    }));
  }

  useEffect(() => {
    async function fetchProjects() {
      try {
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const projectStats = await getProjectStats(api);
        setProjects(projectStats);
        console.log('Project Stats:', projectStats); // Debug log
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Sort projects by last_activity_at in descending order (newest first)
  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">GitLab Projects</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Project Count: {projects.length}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">{project.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-500">Commits</h4>
                    <p>{project.commits_count}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500">Last Activity</h4>
                    <p>{new Date(project.last_activity_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-500 mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(project.languages).map(([lang, percentage]: [string, any]) => (
                      <span key={lang} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {lang}: {percentage}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-500 mb-2">Contributors</h4>
                  <div className="h-40">
                    <Pie
                      data={{
                        labels: project.contributors.map(c => c.name),
                        datasets: [{
                          data: project.contributors.map(c => c.commits),
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.5)',  // blue
                            'rgba(16, 185, 129, 0.5)',  // green
                            'rgba(239, 68, 68, 0.5)',   // red
                            'rgba(217, 119, 6, 0.5)',   // yellow
                            'rgba(139, 92, 246, 0.5)',  // purple
                            'rgba(236, 72, 153, 0.5)',  // pink
                          ],
                          borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(239, 68, 68)',
                            'rgb(217, 119, 6)',
                            'rgb(139, 92, 246)',
                            'rgb(236, 72, 153)',
                          ],
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right' as const,
                            labels: {
                              boxWidth: 12,
                              font: {
                                size: 11
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.label}: ${context.parsed} commits`
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <Link 
                  href={`/debug/projects/${project.id}`}
                  className="text-blue-500 hover:underline text-sm inline-block mt-2"
                >
                  View Commits
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Raw JSON Data</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(projects, null, 2)}
        </pre>
      </div>
    </div>
  );
} 