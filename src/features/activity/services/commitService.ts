// src/features/activity/services/commitService.ts
import { api } from '@/lib/api';

export async function fetchCommitStats(projectId: number, commitId: string) {
  const response = await api.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}`);
  return response.data.stats || {
    additions: 0,
    deletions: 0,
    total: 0
  };
}

export async function fetchProjectCommits(projectId: number, branchName: string) {
  try {
    const response = await api.get(`/api/v4/projects/${projectId}/repository/commits?ref_name=${branchName}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch commits for project ${projectId}:`, error);
    return [];
  }
}