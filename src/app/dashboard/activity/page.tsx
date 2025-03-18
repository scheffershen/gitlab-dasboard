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
import { PieChart, Pie, Label, ViewBox } from 'recharts';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, YAxis } from 'recharts';

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

interface Commit {
  id: string;
  project_id: number;
  project_name: string;
  author_name: string;
  created_at: string;
  title: string;
  branch_name: string;
  is_default_branch: boolean;
}

interface CommitData {
  commits: Commit[];
  timestamp: string;
}

interface PieChartViewBox {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

interface Project {
  id: number;
  name: string;
  value: number;
}

interface Contributor {
  name: string;
  commits: number;
}

export default function ActivityPage() {
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(false);
  const [commitsData, setCommitsData] = useState<CommitData | null>(null);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCommit, setSelectedCommit] = useState<{projectId: string, commitId: string} | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState('all');

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

  // Get project stats for pie chart
  const projectStats = useMemo(() => {
    if (!commitsData?.commits) return [];
    return projects.map(project => ({
      ...project,
      value: commitsData.commits.filter(commit => commit.project_id === project.id).length
    }));
  }, [projects, commitsData]);

  // Get contributor stats for bar chart
  const contributorStats = useMemo(() => {
    if (!commitsData?.commits) return [];
    return contributors.map(author => ({
      name: author,
      commits: commitsData.commits.filter(commit => commit.author_name === author).length
    }));
  }, [contributors, commitsData]);

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
            
            return commitsResponse.data.map((commit: any) => ({
              ...commit,
              project_name: project.name,
              project_id: project.id,
              branch_name: branch.name,
              is_default_branch: branch.name === project.default_branch
            }))
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
                  
                  return commitsResponse.data.map((commit: any) => ({
                    ...commit,
                    project_name: project.name,
                    project_id: project.id,
                    branch_name: branch.name,
                    is_default_branch: branch.name === project.default_branch
                  }))
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
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>          
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Commits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{commitsData.commits.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Contributors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{contributors.length}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>              
        )}

        {!loading && commitsData?.commits && commitsData.commits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project & Contributor Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart - Projects */}
                <div className="h-[300px] relative p-4 bg-muted rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Commits Distribution by Project
                  </h3>
                  <div className="h-full">
                    <PieChart width={400} height={300}>
                      <Pie
                        data={projectStats}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }: { viewBox: ViewBox }) => {
                            if (!viewBox) return null;
                            const total = projectStats.reduce((acc, project) => acc + project.value, 0);
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {total}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy + 24}
                                  className="fill-muted-foreground"
                                >
                                  Commits
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </div>
                </div>

                {/* Bar Chart - Contributors */}
                <div className="h-[300px] relative p-4 bg-muted rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Commits by Contributor
                  </h3>
                  <div className="h-full">
                    <BarChart
                      width={400}
                      height={250}
                      data={contributorStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--muted-foreground)" opacity={0.1} />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Author
                                    </span>
                                    <span className="font-bold text-sm">
                                      {payload[0].payload.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                      Commits
                                    </span>
                                    <span className="font-bold text-sm">
                                      {payload[0].value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="commits"
                        fill="var(--chart-1)"
                        radius={[4, 4, 4, 4]}
                      />
                    </BarChart>
                  </div>
                </div>
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
                <CardHeader className="bg-muted border-b">
                  <CardTitle className="text-lg">{date}</CardTitle>
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
      </div>
    </PageContainer>
  );
}