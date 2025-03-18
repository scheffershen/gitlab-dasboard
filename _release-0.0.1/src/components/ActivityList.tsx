'use client';

import ActivityDetail from './ActivityDetail';

interface Activity {
  id: string;
  type: string;
  created_at: string;
  author: {
    name: string;
    avatar_url: string;
  };
  project: {
    name: string;
  };
  push_data?: {
    commit_count: number;
    ref: string;
    commit_title: string;
  };
  target_title?: string;
}

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              ) : null}
              <ActivityDetail activity={activity} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 