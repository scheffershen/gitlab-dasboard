'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface CommitDetail {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  created_at: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  status: string;
}

interface CommitDiff {
  old_path: string;
  new_path: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  changes: number;
}

export default function CommitDetailPage({ 
  params 
}: { 
  params: { id: string; commit_id: string } 
}) {
  const [commit, setCommit] = useState<CommitDetail | null>(null);
  const [diffs, setDiffs] = useState<CommitDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommitDetails() {
      try {
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const [commitResponse, diffResponse] = await Promise.all([
          api.get(`/api/v4/projects/${params.id}/repository/commits/${params.commit_id}`),
          api.get(`/api/v4/projects/${params.id}/repository/commits/${params.commit_id}/diff`)
        ]);

        setCommit(commitResponse.data);
        setDiffs(diffResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commit details');
      } finally {
        setLoading(false);
      }
    }

    fetchCommitDetails();
  }, [params.id, params.commit_id]);

  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <Link href="/debug/projects" className="text-blue-500 hover:underline">
          Projects
        </Link>
        <span>→</span>
        <Link href={`/debug/projects/${params.id}`} className="text-blue-500 hover:underline">
          Commits
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : commit ? (
        <div className="space-y-6">
          {/* Commit Header */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {commit.title}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {commit.message}
                </p>
              </div>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {commit.short_id}
              </code>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>{commit.author_name}</span>
              <span className="mx-2">•</span>
              <span>{new Date(commit.created_at).toLocaleString()}</span>
            </div>
            {commit.stats && (
              <div className="mt-4 flex space-x-4 text-sm">
                <span className="text-green-500">+{commit.stats.additions}</span>
                <span className="text-red-500">-{commit.stats.deletions}</span>
                <span className="text-gray-500">
                  {commit.stats.total} total changes
                </span>
              </div>
            )}
          </div>

          {/* Changed Files */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Changed Files ({diffs.length})
            </h2>
            <div className="space-y-4">
              {diffs.map((diff, index) => (
                <div 
                  key={index}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {diff.new_file && (
                        <span className="text-green-500 text-sm">Added</span>
                      )}
                      {diff.deleted_file && (
                        <span className="text-red-500 text-sm">Deleted</span>
                      )}
                      {diff.renamed_file && (
                        <span className="text-blue-500 text-sm">Renamed</span>
                      )}
                      <span className="font-mono text-sm">
                        {diff.new_path}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {diff.changes} changes
                    </span>
                  </div>
                  <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                    {diff.diff}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 