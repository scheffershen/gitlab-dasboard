'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import CommitModal from '@/components/CommitModal'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  BarElement,
  LinearScale,
  CategoryScale
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

const PERIOD_OPTIONS = [
  { label: '24 hours', value: '1' },
  { label: '7 days', value: '7', default: true },
  { label: '14 days', value: '14' },
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '3 months', value: '90' },
  { label: '6 months', value: '180' },
]

interface CommitData {
  commits: any[]
  timestamp: string
}

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  BarElement,
  LinearScale,
  CategoryScale
)

export default function Page() {
  const [period, setPeriod] = useState('7')
  const [loading, setLoading] = useState(false)
  const [commitsData, setCommitsData] = useState<CommitData | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<{projectId: string, commitId: string} | null>(null)
  const [showJsonModal, setShowJsonModal] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      })

      // First get all projects with their default branch info
      const projectsResponse = await api.get('/api/v4/projects', {
        params: {
          membership: true,
          per_page: 100
        }
      })

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const periodDays = parseInt(period)
      startDate.setDate(startDate.getDate() - periodDays)

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
                    ref_name: branch.name, // Specify the branch
                    since: startDate.toISOString(),
                    until: endDate.toISOString(),
                    per_page: 100
                  }
                })
                
                // Add project and branch info to each commit
                return commitsResponse.data.map((commit: any) => ({
                  ...commit,
                  project_name: project.name,
                  project_id: project.id,
                  branch_name: branch.name,
                  is_default_branch: branch.name === project.default_branch
                }))
              })
            )

            // Flatten commits from all branches and remove duplicates by commit ID
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

      // Merge and sort all commits chronologically
      const allCommits = projectCommits
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setCommitsData({
        commits: allCommits,
        timestamp: new Date().toISOString()
      })
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

  // Add this function to process contributor data
  const getContributorStats = (commits: any[]) => {
    const stats = commits.reduce((acc, commit) => {
      const author = commit.author_name
      acc[author] = (acc[author] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort by commit count descending and take top 10
    const topContributors = Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    return {
      labels: topContributors.map(([name]) => name),
      data: topContributors.map(([, count]) => count),
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Activity</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period Filter */}
            <div>
              <label 
                htmlFor="period"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Period
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Update Data
              </button>
            </div>
          </div>
        </div>

        {/* Replace the existing Contributors Chart section with this */}
        {!loading && commitsData?.commits.length ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Contributors Statistics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-[300px] relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Contribution Distribution
                </h3>
                <Pie
                  data={{
                    labels: getContributorStats(commitsData.commits).labels,
                    datasets: [
                      {
                        data: getContributorStats(commitsData.commits).data,
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(217, 119, 6, 0.8)',
                          'rgba(139, 92, 246, 0.8)',
                          'rgba(236, 72, 153, 0.8)',
                          'rgba(14, 165, 233, 0.8)',
                          'rgba(168, 85, 247, 0.8)',
                          'rgba(251, 146, 60, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                        ],
                        borderColor: [
                          'rgb(59, 130, 246)',
                          'rgb(16, 185, 129)',
                          'rgb(239, 68, 68)',
                          'rgb(217, 119, 6)',
                          'rgb(139, 92, 246)',
                          'rgb(236, 72, 153)',
                          'rgb(14, 165, 233)',
                          'rgb(168, 85, 247)',
                          'rgb(251, 146, 60)',
                          'rgb(34, 197, 94)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: { size: 11 },
                          padding: 15,
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || ''
                            const value = context.parsed
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                            const percentage = ((value * 100) / total).toFixed(1)
                            return `${label}: ${value} commits (${percentage}%)`
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Vertical Separator - only visible on large screens */}
              <div className="hidden lg:block absolute left-1/2 top-[5.5rem] bottom-6 w-px bg-gray-200 dark:bg-gray-700" />

              {/* Bar Chart */}
              <div className="h-[300px] relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Commits per Contributor
                </h3>
                <Bar
                  data={{
                    labels: getContributorStats(commitsData.commits).labels,
                    datasets: [
                      {
                        data: getContributorStats(commitsData.commits).data,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                      }
                    ]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `${context.parsed.x} commits`
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Commits Display */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : commitsData?.commits.length ? (
          <div className="space-y-6">
            {Object.entries(
              commitsData.commits.reduce((acc, commit) => {
                const commitDate = new Date(commit.created_at)
                const today = new Date()
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)

                let dateLabel
                if (
                  commitDate.getDate() === today.getDate() &&
                  commitDate.getMonth() === today.getMonth() &&
                  commitDate.getFullYear() === today.getFullYear()
                ) {
                  dateLabel = 'Today'
                } else if (
                  commitDate.getDate() === yesterday.getDate() &&
                  commitDate.getMonth() === yesterday.getMonth() &&
                  commitDate.getFullYear() === yesterday.getFullYear()
                ) {
                  dateLabel = 'Yesterday'
                } else {
                  dateLabel = commitDate.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                }

                if (!acc[dateLabel]) acc[dateLabel] = []
                acc[dateLabel].push(commit)
                return acc
              }, {} as Record<string, typeof commitsData.commits>)
            ).map(([date, dayCommits]) => (
              <div key={date} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {date}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                          Project
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">
                          Commit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Author
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Time
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dayCommits.map((commit) => (
                        <tr key={commit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                              {commit.project_name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                {commit.branch_name}
                              </span>
                              {commit.is_default_branch && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                                  default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {commit.title}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {commit.author_name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(commit.created_at).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedCommit({
                                projectId: commit.project_id.toString(),
                                commitId: commit.id
                              })}
                              className="text-blue-500 hover:underline text-sm"
                            >
                              View Changes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No commits found in the selected period
          </div>
        )}
      </div>

      {/* Commit Modal */}
      <CommitModal
        isOpen={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
        projectId={selectedCommit?.projectId || ''}
        commitId={selectedCommit?.commitId || ''}
      />

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
                {JSON.stringify(commitsData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
