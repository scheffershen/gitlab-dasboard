'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './ui/Modal';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  commitId: string;
}

export default function CommitModal({ isOpen, onClose, projectId, commitId }: CommitModalProps) {
  const [commit, setCommit] = useState<any>(null);
  const [diffs, setDiffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchCommitDetails() {
      try {
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const [commitResponse, diffResponse] = await Promise.all([
          api.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}`),
          api.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}/diff`)
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
  }, [isOpen, projectId, commitId]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Commit Details"
      className={isFullscreen ? 'fixed inset-0 w-full h-full' : 'max-w-4xl'}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Commit Details</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className={`overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'max-h-[80vh]'}`}>
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
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {commit.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {commit.message}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <span>{commit.author_name}</span>
                <span className="mx-2">•</span>
                <span>{new Date(commit.created_at).toLocaleString()}</span>
              </div>
              {commit.stats && (
                <div className="mt-4 flex space-x-4 text-sm">
                  <span className="text-green-500">+{commit.stats.additions}</span>
                  <span className="text-red-500">-{commit.stats.deletions}</span>
                  <span className="text-gray-500">{commit.stats.total} changes</span>
                </div>
              )}
            </div>

            <div className="flex h-[calc(100vh-200px)]">
              {/* Left Sidebar - File List */}
              <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto">
                <div className="space-y-1 p-4">
                  {diffs.map((diff, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDiffIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        selectedDiffIndex === index ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {/* File Status Indicator */}
                        <div className="flex-shrink-0 w-2 h-2 rounded-full">
                          {diff.new_file && <div className="w-full h-full bg-green-500" />}
                          {diff.deleted_file && <div className="w-full h-full bg-red-500" />}
                          {diff.renamed_file && <div className="w-full h-full bg-blue-500" />}
                          {!diff.new_file && !diff.deleted_file && !diff.renamed_file && (
                            <div className="w-full h-full bg-yellow-500" />
                          )}
                        </div>
                        
                        {/* File Name */}
                        <div className="flex-1 truncate">
                          <span className="font-mono text-sm">
                            {diff.new_path}
                          </span>
                        </div>
                        
                        {/* Changes Count */}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {diff.changes} Δ
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side - Diff Content */}
              <div className="flex-1 overflow-hidden">
                {diffs.length > 0 && (
                  <div className="h-full flex flex-col">
                    {/* File Header */}
                    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {diffs[selectedDiffIndex].new_file && (
                            <span className="text-green-500 text-sm px-2 py-1 rounded-full bg-green-100 dark:bg-green-900">Added</span>
                          )}
                          {diffs[selectedDiffIndex].deleted_file && (
                            <span className="text-red-500 text-sm px-2 py-1 rounded-full bg-red-100 dark:bg-red-900">Deleted</span>
                          )}
                          {diffs[selectedDiffIndex].renamed_file && (
                            <span className="text-blue-500 text-sm px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900">Renamed</span>
                          )}
                          <span className="font-mono text-sm font-medium">
                            {diffs[selectedDiffIndex].new_path}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {diffs[selectedDiffIndex].changes} changes
                        </span>
                      </div>
                    </div>

                    {/* Diff Content */}
                    <div className="flex-1 overflow-auto p-4">
                      <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded">
                        {diffs[selectedDiffIndex].diff}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
} 