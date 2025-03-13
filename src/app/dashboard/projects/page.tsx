import ProjectStats from '@/components/ProjectStats';
import { getGitlabData } from '@/lib/gitlab';

export default async function ProjectsPage() {
  // Get project data with enhanced statistics
  const projectData = await getGitlabData('projects/stats');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Project Statistics
        </h1>
      </div>
      <ProjectStats projectData={projectData} />
    </div>
  );
} 