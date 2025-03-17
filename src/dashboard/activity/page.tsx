'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement
);

const PERIOD_OPTIONS = [
  { label: '24 hours', value: '1' },
  { label: '7 days', value: '7', default: true },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '3 months', value: '90' },
  { label: '6 months', value: '180' },
  { label: '1 year', value: '365' },
  { label: '2 years', value: '730' }
];

interface Project {
  id: number;
  name: string;
  default_branch?: string;
}

interface CommitData {
  commits: any[];
  timestamp: string;
}

export default function ActivityPage() {
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(false);
  const [commitsData, setCommitsData] = useState<CommitData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('all');

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    handleSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });

      const projectsResponse = await api.get('/api/v4/projects', {
        params: { membership: true, per_page: 100 }
      });

      const sortedProjects = projectsResponse.data
        .map((p: any) => ({ id: p.id, name: p.name }))
        .sort((a: Project, b: Project) => a.name.localeCompare(b.name));

      setProjects(sortedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const commits = await fetchCommits(api, startDate, endDate);
      setCommitsData({
        commits,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async (api: any, startDate: Date, endDate: Date) => {
    if (selectedProject !== 'all') {
      return await fetchProjectCommits(api, selectedProject, startDate, endDate);
    }
    return await fetchAllProjectsCommits(api, startDate, endDate);
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Activity</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder='Select period' />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder='Select project' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Loading...' : 'Update Data'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add stats cards and charts here */}
        {!loading && commitsData?.commits.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='p-4 bg-muted rounded-lg'>
                    <p className='text-sm font-medium text-muted-foreground'>Total Commits</p>
                    <p className='mt-1 text-2xl font-semibold'>{commitsData.commits.length}</p>
                  </div>
                  <div className='p-4 bg-muted rounded-lg'>
                    <p className='text-sm font-medium text-muted-foreground'>Contributors</p>
                    <p className='mt-1 text-2xl font-semibold'>
                      {new Set(commitsData.commits.map(c => c.author_name)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add commit list and other components here */}
          </>
        )}
      </div>
    </PageContainer>
  );
} 