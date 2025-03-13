'use client';

import { useState, useEffect } from 'react';
import { getGitlabData } from '@/lib/gitlab';

export default function ActivityDebugPage() {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const events = await getGitlabData('events');
        setActivity(events);
        
        // Log to console for easier inspection
        console.log('Activity Data:', events);
        
        // Check project property
        if (events && events.length > 0) {
          console.log('First Event Project:', events[0].project);
          console.log('Sample Event Structure:', {
            project_id: events[0].project_id,
            action_name: events[0].action_name,
            target_type: events[0].target_type,
            created_at: events[0].created_at,
            // Log all available properties
            allProps: Object.keys(events[0])
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading activity data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Activity Debug</h1>
      
      {activity && activity.length > 0 ? (
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">First Activity Item Structure</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                Available Properties: {Object.keys(activity[0]).join(', ')}
              </pre>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Sample Activity Item (First Item)</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(activity[0], null, 2)}
              </pre>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">All Activity Items ({activity.length})</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
              <pre className="text-sm">
                {JSON.stringify(activity, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No activity data available</div>
      )}
    </div>
  );
} 