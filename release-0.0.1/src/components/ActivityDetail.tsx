'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from './ui/Modal';
import {
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';
import { getGitlabData } from '@/lib/gitlab';

interface CommitData {
  id: string;
  title: string;
  message: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface Project {
  id: number;
  name: string;
  web_url: string;
  description?: string;
}

interface ActivityDetailProps {
  activity: {
    id: string;
    type: string;
    created_at: string;
    author: {
      name: string;
      avatar_url: string;
      email?: string;
    };
    project_id: number;
    push_data?: {
      commit_count: number;
      ref: string;
      commit_title: string;
      commits?: CommitData[];
    };
    target_title?: string;
    commit_id?: string;
  };
}

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!isOpen || !activity.project_id) return;
      
      setLoading(true);
      try {
        const projectData = await getGitlabData(`projects/${activity.project_id}`);
        setProject(projectData);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [isOpen, activity.project_id]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pushed':
        return <ArrowUpRightIcon className="h-5 w-5" />;
      case 'commented':
        return <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />;
      default:
        return <CodeBracketIcon className="h-5 w-5" />;
    }
  };

  const renderCommitStats = (stats?: { additions: number; deletions: number; total: number }) => {
    if (!stats) return null;

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="text-green-500">+{stats.additions}</span>
        <span className="text-red-500">-{stats.deletions}</span>
        <span>Total: {stats.total}</span>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
      >
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full"
            src={activity.author.avatar_url}
            alt={activity.author.name}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {activity.author.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(activity.created_at), 'PPp')}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {activity.push_data?.commit_title || activity.target_title}
          </p>
        </div>
        <div className="flex-shrink-0 self-center">
          {getActivityIcon(activity.type)}
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Activity Details"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={activity.author.avatar_url}
              alt={activity.author.name}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {activity.author.name}
              </h4>
              {activity.author.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.author.email}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Project
            </h4>
            {loading ? (
              <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : project ? (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {project.name}
                </p>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {project.description}
                  </p>
                )}
                <a
                  href={project.web_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                >
                  View in GitLab
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-500">No project details available</p>
            )}
          </div>

          {activity.push_data && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Commit Information
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Branch: <span className="font-mono">{activity.push_data.ref}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Commits: {activity.push_data.commit_count}
              </p>
              
              {activity.push_data.commits?.map((commit) => (
                <div
                  key={commit.id}
                  className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-300">
                    {commit.id.substring(0, 8)}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {commit.title}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                    {commit.message}
                  </p>
                  {renderCommitStats(commit.stats)}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created at: {format(new Date(activity.created_at), 'PPpp')}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
} 