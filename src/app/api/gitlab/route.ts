import { NextResponse } from 'next/server';
import axios, { AxiosInstance } from 'axios';
import { subYears } from 'date-fns';
import { ApiError } from '@/utils/error';

const gitlabUrl = process.env.NEXT_PUBLIC_GITLAB_URL;
const gitlabToken = process.env.GITLAB_TOKEN;

const api = axios.create({
  baseURL: gitlabUrl,
  headers: {
    'PRIVATE-TOKEN': gitlabToken
  }
});

async function getProjectStats(api: AxiosInstance) {
  try {
    // Get all projects
    const projectsResponse = await api.get('/api/v4/projects', {
      params: {
        membership: true,
        per_page: 100,
        statistics: true
      }
    });

    const projects = await Promise.all(projectsResponse.data.map(async (project: any) => {
      // Get project languages
      const languagesResponse = await api.get(`/api/v4/projects/${project.id}/languages`);
      
      // Get project contributors
      const contributorsResponse = await api.get(`/api/v4/projects/${project.id}/repository/contributors`);
      
      return {
        id: project.id,
        name: project.name,
        commits_count: project.statistics?.commit_count || 0,
        last_activity_at: project.last_activity_at,
        contributors: contributorsResponse.data.map((contributor: any) => ({
          name: contributor.name,
          commits: contributor.commits
        })),
        languages: languagesResponse.data
      };
    }));

    return projects;
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
}

async function getUserContributions(api: AxiosInstance, userId: string) {
  const startDate = subYears(new Date(), 1);
  
  try {
    // Get user events
    const eventsResponse = await api.get(`/api/v4/users/${userId}/events`, {
      params: {
        after: startDate.toISOString(),
        per_page: 100
      }
    });

    // Process events into contributions
    const contributions = eventsResponse.data.reduce((acc: any[], event: any) => {
      const date = event.created_at.split('T')[0];
      const existing = acc.find(c => c.date === date);
      
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({
          date,
          count: 1,
          type: event.action_name
        });
      }
      
      return acc;
    }, []);

    // Calculate statistics
    const stats = calculateUserStats(contributions);

    return {
      data: contributions,
      stats
    };
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    throw error;
  }
}

function calculateUserStats(contributions: Contribution[]) {
  const totalContributions = contributions.reduce((sum, c) => sum + c.count, 0);
  
  const contributionsByType = contributions.reduce((acc: {[key: string]: number}, c) => {
    acc[c.type] = (acc[c.type] || 0) + c.count;
    return acc;
  }, {});

  // Calculate streaks
  const streaks = calculateStreaks(contributions);

  // Find most active day
  const mostActiveDay = contributions.reduce((max, c) => 
    c.count > (max?.count || 0) ? c : max
  , { date: '', count: 0 });

  return {
    totalContributions,
    contributionsByType,
    streaks,
    mostActiveDay
  };
}

function calculateStreaks(contributions: Contribution[]) {
  // Sort contributions by date
  const sortedDates = contributions
    .filter(c => c.count > 0)
    .map(c => c.date)
    .sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let currentCount = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    const nextDate = new Date(sortedDates[i + 1]);
    
    currentCount++;

    if (nextDate.getTime() - date.getTime() > 86400000) { // More than 1 day difference
      longestStreak = Math.max(longestStreak, currentCount);
      currentCount = 0;
    }
  }

  currentStreak = currentCount;
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    current: currentStreak,
    longest: longestStreak
  };
}

function handleGitlabError(error: any) {
  if (error.response) {
    // GitLab API error response
    const status = error.response.status;
    const message = error.response.data.message || 'GitLab API error';
    
    switch (status) {
      case 401:
        return new ApiError('Unauthorized: Invalid GitLab token', 401, 'UNAUTHORIZED');
      case 403:
        return new ApiError('Forbidden: Insufficient permissions', 403, 'FORBIDDEN');
      case 404:
        return new ApiError('Not found', 404, 'NOT_FOUND');
      case 429:
        return new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT');
      default:
        return new ApiError(message, status, 'GITLAB_API_ERROR');
    }
  }

  if (error.request) {
    // Network error
    return new ApiError(
      'Network error: Unable to reach GitLab API',
      500,
      'NETWORK_ERROR'
    );
  }

  // Unknown error
  return new ApiError(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const timeRange = searchParams.get('timeRange') || '7';
  const projectId = searchParams.get('projectId') || 'all';
  const userId = searchParams.get('userId') || 'all';

  try {
    switch (type) {
      case 'projects':
        const projects = await api.get('/api/v4/projects', {
          params: {
            membership: true,
            per_page: 100
          }
        });
        return NextResponse.json(projects.data);

      case 'users':
        const users = await api.get('/api/v4/users', {
          params: {
            per_page: 100
          }
        });
        return NextResponse.json(users.data);

      case 'activities':
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));
        
        const activities = await api.get('/api/v4/events', {
          params: {
            after: startDate.toISOString(),
            per_page: 100,
            ...(projectId !== 'all' && { project_id: projectId }),
          }
        });
        return NextResponse.json(activities.data);

      case 'projects/stats':
        const projectStats = await getProjectStats(api);
        return NextResponse.json(projectStats);

      case 'users/contributions':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const contributions = await getUserContributions(api, userId);
        return NextResponse.json(contributions);

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    const handledError = handleGitlabError(error);
    console.error('GitLab API Error:', handledError);
    
    return NextResponse.json({
      error: handledError.message,
      code: handledError.code
    }, { status: handledError.status });
  }
} 