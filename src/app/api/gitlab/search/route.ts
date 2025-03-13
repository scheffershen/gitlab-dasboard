import { NextResponse } from 'next/server';
import axios from 'axios';

const gitlabUrl = process.env.NEXT_PUBLIC_GITLAB_URL;
const gitlabToken = process.env.GITLAB_TOKEN;

const api = axios.create({
  baseURL: gitlabUrl,
  headers: {
    'PRIVATE-TOKEN': gitlabToken
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const [projects, users, activities] = await Promise.all([
      // Search projects
      api.get('/api/v4/projects', {
        params: {
          search: query,
          membership: true,
          per_page: 5
        }
      }),

      // Search users
      api.get('/api/v4/users', {
        params: {
          search: query,
          per_page: 5
        }
      }),

      // Search activities (events)
      api.get('/api/v4/events', {
        params: {
          per_page: 5,
          action: query
        }
      })
    ]);

    const results = [
      ...projects.data.map((project: any) => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        subtitle: project.description,
        url: `/dashboard/projects/${project.id}`,
        avatar_url: project.avatar_url
      })),

      ...users.data.map((user: any) => ({
        id: user.id,
        type: 'user' as const,
        title: user.name,
        subtitle: user.username,
        url: `/dashboard/users/${user.id}`,
        avatar_url: user.avatar_url
      })),

      ...activities.data.map((activity: any) => ({
        id: activity.id,
        type: 'activity' as const,
        title: activity.push_data?.commit_title || activity.target_title || 'Activity',
        subtitle: `${activity.author.name} - ${new Date(activity.created_at).toLocaleDateString()}`,
        url: `/dashboard/activities/${activity.id}`,
        avatar_url: activity.author.avatar_url
      }))
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
} 