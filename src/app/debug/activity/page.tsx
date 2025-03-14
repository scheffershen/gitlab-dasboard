'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import Link from 'next/link';

interface Event {
  id: number;
  project_id: number;
  action_name: string;
  author: {
    name: string;
  };
  created_at: string;
  project_name?: string; // Add this to store fetched project name
}

export default function ActivityPage() {
  const [commits, setCommits] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function getProjectDetails(api: AxiosInstance, projectId: number) {
    try {
      const response = await api.get(`/api/v4/projects/${projectId}`);
      return response.data.name;
    } catch (err) {
      console.error(`Failed to fetch project name for ID ${projectId}:`, err);
      return 'Unknown Project';
    }
  }

  async function getActivityEvents(api: AxiosInstance, pageNum: number) {
    try {
      const response = await api.get('/api/v4/events', {
        params: {
          per_page: 20,
          page: pageNum
        }
      });

      const totalPages = parseInt(response.headers['x-total-pages'] || '0');
      setHasMore(pageNum < totalPages);

      // Fetch project names for each event
      const eventsWithProjects = await Promise.all(
        response.data.map(async (event: Event) => ({
          ...event,
          project_name: await getProjectDetails(api, event.project_id)
        }))
      );

      return eventsWithProjects;
    } catch (err) {
      throw err;
    }
  }

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const data = await getActivityEvents(api, page);
        setCommits(prevCommits => page === 1 ? data : [...prevCommits, ...data]);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [page]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href="/debug" className="text-blue-500 hover:underline">
          ← Back to Debug
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">Recent Activity</h1>

      <div className="space-y-4">
        {commits.map((event) => (
          <div 
            key={event.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{event.project_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {event.action_name} by {event.author?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center p-4">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-red-500 p-4">
            Error: {error}
          </div>
        )}

        {!loading && !error && hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full p-4 text-center text-blue-500 hover:text-blue-600"
          >
            Load More
          </button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Raw JSON Data</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          {JSON.stringify(commits, null, 2)}
        </pre>
      </div>
    </div>
  );
} 