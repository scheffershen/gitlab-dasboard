'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { buttonVariants } from '@/components/ui/button';
import CommitModal from '@/components/commit-modal';
import { PieChart, Pie, Label, ViewBox, Legend, BarChart, Bar, XAxis, CartesianGrid, Tooltip, YAxis, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  PERIOD_OPTIONS,
  CHART_COLORS,
  chartConfig
} from './constants';
import {
  type Commit,
  type CommitData,
  type PieChartViewBox,
  type Project,
  type Contributor
} from './types';
// Make sure ChartConfig is imported if it was defined here originally
// import { type ChartConfig } from "@/components/ui/chart"; // Or wherever it comes from

export default function ActivityPage() {
  const [period, setPeriod] = useState('1');
  const [loading, setLoading] = useState(false);
  const [commitsData, setCommitsData] = useState<CommitData | null>(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCommit, setSelectedCommit] = useState<{projectId: string, commitId: string} | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  // Get unique projects from commits
  const projects = useMemo(() => {
    if (!commitsData?.commits) return [];
    const uniqueProjects = new Map();
    commitsData.commits.forEach(commit => {
      if (!uniqueProjects.has(commit.project_id)) {
        uniqueProjects.set(commit.project_id, {
          id: commit.project_id,
          name: commit.project_name,
          value: 0
        });
      }
    });
    return Array.from(uniqueProjects.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [commitsData]);

  // Get unique contributors from commits
  const contributors = useMemo(() => {
    if (!commitsData?.commits) return [];
    const uniqueContributors = new Set(commitsData.commits.map(commit => commit.author_name));
    return Array.from(uniqueContributors).sort();
  }, [commitsData]);

  // Add this memoized filtered commits
  const filteredCommits = useMemo(() => {
    if (!commitsData?.commits) return [];
    return commitsData.commits.filter(commit => {
      const matchesProject = selectedProject === 'all' || commit.project_id.toString() === selectedProject;
      const matchesContributor = selectedContributor === 'all' || commit.author_name === selectedContributor;
      return matchesProject && matchesContributor;
    });
  }, [commitsData, selectedProject, selectedContributor]);

  // Update the projectStats calculation
  const projectStats = useMemo(() => {
    return projects
      .map((project, index) => ({
        ...project,
        value: filteredCommits.filter(commit => commit.project_id === project.id).length,
        fill: CHART_COLORS[index % CHART_COLORS.length] // Color assigned here
      }))
      .sort((a, b) => b.value - a.value); // Sort by commit count descending
  }, [projects, filteredCommits]);

  // Update the contributorStats calculation
  const contributorStats = useMemo(() => {
    return contributors
      .map(author => ({
        name: author,
        commits: filteredCommits.filter(commit => commit.author_name === author).length
      }))
      .sort((a, b) => b.commits - a.commits);
  }, [contributors, filteredCommits]);

  // Calculate additions per project
  const projectAdditionsStats = useMemo(() => {
    if (selectedProject !== 'all') return []; // Only calculate if 'all' projects are selected
    return projects
      .map((project, index) => ({
        name: project.name,
        value: filteredCommits
          .filter(commit => commit.project_id === project.id)
          .reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0),
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .filter(p => p.value > 0) // Only include projects with additions
      .sort((a, b) => b.value - a.value);
  }, [projects, filteredCommits, selectedProject]);

  // Calculate deletions per project
  const projectDeletionsStats = useMemo(() => {
    if (selectedProject !== 'all') return []; // Only calculate if 'all' projects are selected
    return projects
      .map((project, index) => ({
        name: project.name,
        value: filteredCommits
          .filter(commit => commit.project_id === project.id)
          .reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0),
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .filter(p => p.value > 0) // Only include projects with deletions
      .sort((a, b) => b.value - a.value);
  }, [projects, filteredCommits, selectedProject]);


  const handleSubmit = async () => {
    setLoading(true)
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      })

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const periodDays = parseInt(period)
      startDate.setDate(startDate.getDate() - periodDays)

      // If specific project is selected
      if (selectedProject !== 'all') {
        const project = projects.find(p => p.id.toString() === selectedProject)
        if (!project) return

        // First get all branches
        const branchesResponse = await api.get(`/api/v4/projects/${selectedProject}/repository/branches`)
        
        // Fetch commits from each branch in parallel
        const branchCommits = await Promise.all(
          branchesResponse.data.map(async (branch: any) => {
            const commitsResponse = await api.get(`/api/v4/projects/${selectedProject}/repository/commits`, {
              params: {
                ref_name: branch.name,
                since: startDate.toISOString(),
                until: endDate.toISOString(),
                per_page: 100
              }
            })
            
            // Get detailed stats for each commit
            const commitsWithStats = await Promise.all(
              commitsResponse.data.map(async (commit: any) => {
                const detailResponse = await api.get(
                  `/api/v4/projects/${selectedProject}/repository/commits/${commit.id}`
                );
                return {
                  ...commit,
                  project_name: project.name,
                  project_id: project.id,
                  branch_name: branch.name,
                  is_default_branch: branch.name === project.default_branch,
                  stats: {
                    additions: detailResponse.data.stats?.additions || 0,
                    deletions: detailResponse.data.stats?.deletions || 0,
                    total: detailResponse.data.stats?.total || 0,
                    files_changed: detailResponse.data.stats?.total || 0, // GitLab doesn't provide this directly
                    files_added: 0, // We'll need to parse the diff to get these
                    files_deleted: 0,
                    files_modified: 0
                  }
                };
              })
            );

            return commitsWithStats;
          })
        )

        // Flatten commits and remove duplicates
        const allCommits = Array.from(
          new Map(
            branchCommits.flat().map(commit => [commit.id, commit])
          ).values()
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setCommitsData({
          commits: allCommits,
          timestamp: new Date().toISOString()
        })
      } else {
        // First get all projects with their default branch info
        const projectsResponse = await api.get('/api/v4/projects', {
          params: {
            membership: true,
            per_page: 100
          }
        })

        // Fetch commits from all projects in parallel
        const projectCommits = await Promise.all(
          projectsResponse.data.map(async (project: any) => {
            try {
              // First get all branches
              const branchesResponse = await api.get(`/api/v4/projects/${project.id}/repository/branches`)
              
              // Fetch commits from each branch in parallel
              const branchCommits = await Promise.all(
                branchesResponse.data.map(async (branch: any) => {
                  const commitsResponse = await api.get(`/api/v4/projects/${project.id}/repository/commits`, {
                    params: {
                      ref_name: branch.name,
                      since: startDate.toISOString(),
                      until: endDate.toISOString(),
                      per_page: 100
                    }
                  })
                  
                  // Get detailed stats for each commit
                  const commitsWithStats = await Promise.all(
                    commitsResponse.data.map(async (commit: any) => {
                      const detailResponse = await api.get(
                        `/api/v4/projects/${project.id}/repository/commits/${commit.id}`
                      );
                      return {
                        ...commit,
                        project_name: project.name,
                        project_id: project.id,
                        branch_name: branch.name,
                        is_default_branch: branch.name === project.default_branch,
                        stats: {
                          additions: detailResponse.data.stats?.additions || 0,
                          deletions: detailResponse.data.stats?.deletions || 0,
                          total: detailResponse.data.stats?.total || 0,
                          files_changed: detailResponse.data.stats?.total || 0,
                          files_added: 0,
                          files_deleted: 0,
                          files_modified: 0
                        }
                      };
                    })
                  );

                  return commitsWithStats;
                })
              )

              return Array.from(
                new Map(
                  branchCommits.flat().map(commit => [commit.id, commit])
                ).values()
              )
            } catch (error) {
              console.error(`Failed to fetch commits for project ${project.id}:`, error)
              return []
            }
          })
        )

        const allCommits = projectCommits
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setCommitsData({
          commits: allCommits,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to fetch commits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    handleSubmit()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add this useEffect after the existing ones
  useEffect(() => {
    handleSubmit();
  }, [selectedProject, period, selectedContributor]);

  const generateDailyReport = async (date: string, commits: Commit[]) => {
    setIsGeneratingReport(true);
    setReportContent(''); // Reset previous content
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          commits: commits.map(commit => ({
            title: commit.title,
            message: commit.message,
            author: commit.author_name,
            project: commit.project_name
          }))
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setReportContent(data.report);
    } catch (error) {
      setReportContent(`
        <div class="text-red-500 space-y-4">
          <h3 class="font-bold text-lg">Erreur de génération du rapport</h3>
          <p>${error instanceof Error ? error.message : 'Une erreur inattendue est survenue'}</p>
          <p class="text-sm">Veuillez réessayer plus tard ou contacter le support si le problème persiste.</p>
        </div>
      `);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReadAloud = async () => {
    setIsSpeaking(true)
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reportContent, voice: 'onyx', language: 'fr' })
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      setAudioObj(audio)
      audio.onended = () => {
        setIsSpeaking(false)
        setAudioObj(null)
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        setAudioObj(null)
      }
      audio.play()
    } catch (e) {
      setIsSpeaking(false)
      alert('Lecture audio impossible')
    }
  }

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

              <Select value={selectedContributor} onValueChange={setSelectedContributor}>
                <SelectTrigger>
                  <SelectValue placeholder='Select contributor' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All contributors</SelectItem>
                  {contributors.map((contributor) => (
                    <SelectItem key={contributor} value={contributor}>
                      {contributor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!loading && commitsData?.commits && commitsData.commits.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Overview</CardTitle>
              {(selectedContributor !== 'all' || selectedProject !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const periodLabel = PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Custom Period';
                    setSelectedDate(`Derniers ${periodLabel}`);
                    setShowReportModal(true);
                    generateDailyReport(`Derniers ${periodLabel}`, filteredCommits);
                  }}
                >
                  Generate Report
                </Button>
              )}
            </CardHeader>
            <CardContent>          
              <div className='grid gap-4 md:grid-cols-5 lg:grid-cols-5'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{filteredCommits.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Contributors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {new Set(filteredCommits.map(c => c.author_name)).size}
                    </div>
                  </CardContent>
                </Card>
                {/* Additions */}
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Additions lines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {filteredCommits.reduce((sum, c) => sum + (c.stats?.additions || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                {/* Deletions */}
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Deletions lines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {filteredCommits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                {/* Total Changes */}
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Changes lines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {filteredCommits.reduce((sum, c) => sum + (c.stats?.total || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>              
        )}

        {!loading && selectedProject === 'all' && projects.length > 1 && commitsData?.commits && commitsData.commits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project & Contributor Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-2'>
                {/* Horizontal Bar Chart - Projects (Sorted) */}
                <div className='flex flex-col items-center'>
                  <h3 className='mb-2 text-lg font-semibold'>Commits by Project</h3>
                  <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                    <BarChart
                      accessibilityLayer
                      data={projectStats.filter(p => p.value > 0)} // Filter out projects with 0 commits
                      layout="vertical" // Set layout to vertical for horizontal bars
                      margin={{
                        left: 10, // Adjust left margin for project names
                        right: 40, // Add right margin for potential labels
                        top: 5,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="name"
                        type="category" // Y-axis is now category (project names)
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={120} // Adjust width as needed for project names
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} // Truncate long names
                      />
                      <XAxis dataKey="value" type="number" hide /> {/* X-axis is now value (commit count), hide labels */}
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      {/* The 'fill' prop in <Bar> will use the 'fill' property from each data entry */}
                      <Bar dataKey="value" layout="vertical" radius={4}>
                         {/* Optional: Add labels next to bars */}
                         {/* <LabelList
                           dataKey="value"
                           position="right"
                           offset={8}
                           className="fill-foreground"
                           fontSize={12}
                         /> */}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Existing Contributor Commits Bar Chart (Remains the same) */}
                <div className='flex flex-col items-center'>
                  <h3 className='mb-2 text-lg font-semibold'>Commits by Contributor</h3>
                  <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                    <BarChart
                      accessibilityLayer
                      data={contributorStats.slice(0, 10)} // Show top 10 contributors
                      layout='vertical'
                      margin={{ left: 10, right: 10 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey='name'
                        type='category'
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        width={100} // Adjust width as needed
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} // Truncate long names
                      />
                      <XAxis dataKey='commits' type='number' hide />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='line' />} />
                      {/* Modify the Bar component like this: */}
                      <Bar dataKey='commits' radius={4}>
                        {contributorStats.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additions and Deletions Bar Charts */}
        {!loading && selectedProject === 'all' && projects.length > 1 && (projectAdditionsStats.length > 0 || projectDeletionsStats.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Line Changes by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-2'>
                {/* Additions Bar Chart */}
                {projectAdditionsStats.length > 0 && (
                  <div className='flex flex-col items-center'>
                    <h3 className='mb-2 text-lg font-semibold'>Additions by Project</h3>
                    <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                      <BarChart
                        accessibilityLayer
                        data={projectAdditionsStats}
                        layout="vertical"
                        margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={120}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <XAxis dataKey="value" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="value" layout="vertical" radius={4}>
                          {projectAdditionsStats.map((entry, index) => (
                            <Cell key={`cell-add-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}

                {/* Deletions Bar Chart */}
                {projectDeletionsStats.length > 0 && (
                  <div className='flex flex-col items-center'>
                    <h3 className='mb-2 text-lg font-semibold'>Deletions by Project</h3>
                    <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                      <BarChart
                        accessibilityLayer
                        data={projectDeletionsStats}
                        layout="vertical"
                        margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={120}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <XAxis dataKey="value" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="value" layout="vertical" radius={4}>
                          {projectDeletionsStats.map((entry, index) => (
                            <Cell key={`cell-del-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commits Display */}
        {loading ? (
          <Card className="space-y-4">
            <CardContent className="pt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg mb-4"></div>
              ))}
            </CardContent>
          </Card>
        ) : commitsData?.commits.length ? (
          <div className="space-y-6">
            {Object.entries(
              commitsData?.commits
                .filter(commit => selectedContributor === 'all' || commit.author_name === selectedContributor)
                .reduce((acc, commit) => {
                  const commitDate = new Date(commit.created_at);
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);

                  let dateLabel;
                  if (
                    commitDate.getDate() === today.getDate() &&
                    commitDate.getMonth() === today.getMonth() &&
                    commitDate.getFullYear() === today.getFullYear()
                  ) {
                    dateLabel = 'Today';
                  } else if (
                    commitDate.getDate() === yesterday.getDate() &&
                    commitDate.getMonth() === yesterday.getMonth() &&
                    commitDate.getFullYear() === yesterday.getFullYear()
                  ) {
                    dateLabel = 'Yesterday';
                  } else {
                    dateLabel = commitDate.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  }

                  if (!acc[dateLabel]) acc[dateLabel] = [];
                  acc[dateLabel].push(commit);
                  return acc;
                }, {} as Record<string, Commit[]>) || {}
            ).map(([date, dayCommits]) => (
              <Card key={date}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">{date}</CardTitle>
                  {(selectedContributor !== 'all' || selectedProject !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const periodLabel = PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Custom Period';
                        const reportTitle = date === 'Today' || date === 'Yesterday' ? date : `${date} (${periodLabel})`;
                        setSelectedDate(reportTitle);
                        setShowReportModal(true);
                        generateDailyReport(reportTitle, dayCommits);
                      }}
                    >
                      Générer Rapport
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                            Project
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/5">
                            Branch
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/4">
                            Commit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                            Author
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                            Time
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {dayCommits.map((commit) => (
                          <tr key={commit.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium truncate max-w-xs">
                                {commit.project_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                                  {commit.branch_name}
                                </span>
                                {commit.is_default_branch && (
                                  <Badge variant="secondary" className="ml-2">
                                    default
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {commit.title}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {commit.author_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-muted-foreground">
                                {new Date(commit.created_at).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="link"
                                onClick={() => setSelectedCommit({
                                  projectId: commit.project_id.toString(),
                                  commitId: commit.id
                                })}
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No commits found in the selected period
            </CardContent>
          </Card>
        )}

        {/* Commit Modal */}
        <CommitModal
          isOpen={!!selectedCommit}
          onClose={() => setSelectedCommit(null)}
          projectId={selectedCommit?.projectId || ''}
          commitId={selectedCommit?.commitId || ''}
        />

        {/* JSON View Button */}
        <div className="mt-8">
          <Button variant="link" onClick={() => setShowJsonModal(true)}>
            View Raw JSON Data
          </Button>
        </div>

        {/* JSON Modal */}
        <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
          <DialogContent className={`${isFullscreen ? 'w-screen h-screen max-w-none m-0' : 'max-w-4xl'}`}>
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Raw JSON Data</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </Button>
            </DialogHeader>
            <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'max-h-[60vh]'}`}>
              <pre className="text-sm p-4 bg-muted rounded-lg">
                {JSON.stringify(commitsData, null, 2)}
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        <Dialog open={showReportModal} onOpenChange={isSpeaking ? () => {} : setShowReportModal}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Rapport de Développement - {selectedDate}
                {reportContent && !isGeneratingReport && (
                  <Button
                    className="ml-4"
                    size="sm"
                    variant="outline"
                    onClick={handleReadAloud}
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? 'Lecture en cours...' : '🔊 Lire à voix haute'}
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="mt-4 max-h-[60vh]">
              {isGeneratingReport ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div
                  className="prose dark:prose-invert max-w-none px-4"
                  dangerouslySetInnerHTML={{
                    __html: reportContent
                  }}
                />
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}