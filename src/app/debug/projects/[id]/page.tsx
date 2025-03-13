'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import CommitModal from '@/components/CommitModal';

interface Commit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  created_at: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  async function fetchCommits(pageNum: number) {
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });

      const response = await api.get(`/api/v4/projects/${params.id}/repository/commits`, {
        params: {
          per_page: 50,
          page: pageNum
        }
      });

      setHasMore(response.data.length === 50);
      return response.data;
    } catch (err) {
      throw err;
    }
  }

  useEffect(() => {
    async function loadCommits() {
      try {
        setLoading(true);
        const data = await fetchCommits(page);
        setCommits(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commits');
      } finally {
        setLoading(false);
      }
    }

    loadCommits();
  }, [params.id, page]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href="/debug/projects" className="text-blue-500 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">Project Commits</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="space-y-4">
            {commits.map((commit) => (
              <div key={commit.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{commit.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{commit.message}</p>
                  </div>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {commit.short_id}
                  </code>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span>{commit.author_name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => setSelectedCommit(commit.id)}
                  className="text-blue-500 hover:underline text-sm ml-2"
                >
                  View Changes
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <CommitModal
            isOpen={!!selectedCommit}
            onClose={() => setSelectedCommit(null)}
            projectId={params.id}
            commitId={selectedCommit || ''}
          />
        </>
      )}
    </div>
  );
}
