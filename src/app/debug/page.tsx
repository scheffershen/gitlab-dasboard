'use client';

import { useState, useEffect } from 'react';
import { getGitlabData } from '@/lib/gitlab';

export default function DebugPage() {
  const [data, setData] = useState<{
    events: any[];
    projects: any[];
    users: any[];
  }>({
    events: [],
    projects: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [events, projects, users] = await Promise.all([
          getGitlabData('events'),
          getGitlabData('projects'),
          getGitlabData('users')
        ]);

        setData({ events, projects, users });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">GitLab API Debug</h1>
      
      <div className="space-y-8">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2 capitalize">{key}</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
              <pre className="text-sm">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Count: {Array.isArray(value) ? value.length : 0} items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 