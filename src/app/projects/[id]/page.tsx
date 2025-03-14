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

export default function Page({ params }: { params: { id: string } }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [totalCommits, setTotalCommits] = useState<number>(0);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  async function fetchProjectDetails() {
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });

      const response = await api.get(`/api/v4/projects/${params.id}`, {
        params: {
          statistics: true
        }
      });
      
      setProjectName(response.data.name);
      setTotalCommits(response.data.statistics?.commit_count || 0);
    } catch (err) {
      console.error('Error fetching project details:', err);
    }
  }

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

  useEffect(() => {
    fetchProjectDetails();
  }, [params.id]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {projectName ? `${projectName}` : 'Project Commits'}
        </h1>
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          <span className="text-lg font-semibold">Total Commits: {totalCommits}</span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="space-y-6">
            {commits.map((commit) => (
              <div key={commit.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{commit.title}</h3>
                  </div>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {commit.short_id}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>{commit.author_name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCommit(commit.id)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Changes
                  </button>
                </div>
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
      <div className="mt-8">
        <button
          onClick={() => setShowJsonModal(true)}
          className="text-blue-500 hover:underline text-sm"
        >
          View Raw JSON Data
        </button>
      </div>

      {/* JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Raw JSON Data</h2>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="text-sm">
                {JSON.stringify(commits, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}      
    </div>
  );
}
