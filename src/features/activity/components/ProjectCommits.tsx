// src/features/activity/components/ProjectCommits.tsx
import { useState, useEffect } from 'react';
import { fetchProjectCommits, fetchCommitStats } from '@/features/activity/services/commitService';
import { CommitData, Commit } from '@/features/activity/types/commitTypes';

interface ProjectCommitsProps {
  projectId: number;
  projectName: string;
  branchName: string;
  isDefaultBranch: boolean;
  onCommitsData: (data: CommitData) => void;
}

export function ProjectCommits({
  projectId,
  projectName,
  branchName,
  isDefaultBranch,
  onCommitsData
}: ProjectCommitsProps) {
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    async function fetchCommits() {
      try {
        const commitsResponse = await fetchProjectCommits(projectId, branchName);
        const commitsWithStats = await Promise.all(
          commitsResponse.map(async (commit: any) => {
            const stats = await fetchCommitStats(projectId, commit.id);
            return {
              ...commit,
              project_name: projectName,
              project_id: projectId,
              branch_name: branchName,
              is_default_branch: isDefaultBranch,
              stats: {
                additions: stats.additions || 0,
                deletions: stats.deletions || 0,
                total: stats.total || 0,
                files_changed: stats.total || 0,
                files_added: 0,
                files_deleted: 0,
                files_modified: 0
              }
            };
          })
        );

        setCommits(commitsWithStats);
        onCommitsData({
          commits: commitsWithStats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to fetch commits for project ${projectId}:`, error);
        onCommitsData({ commits: [], timestamp: new Date().toISOString() });
      }
    }

    fetchCommits();
  }, [projectId, projectName, branchName, isDefaultBranch, onCommitsData]);

  return null; // This component only handles data fetching
}