import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Commit } from '../types';

interface ActivityCommitsProps {
  commits: Commit[];
  selectedContributor: string;
  selectedProject: string;
  period: string;
  PERIOD_OPTIONS: Array<{ value: string; label: string }>;
  onGenerateReport: (date: string, commits: Commit[]) => void;
  onViewDetails: (projectId: string, commitId: string) => void;
}

export function ActivityCommits({
  commits,
  selectedContributor,
  selectedProject,
  period,
  PERIOD_OPTIONS,
  onGenerateReport,
  onViewDetails
}: ActivityCommitsProps) {
  const groupedCommits = Object.entries(
    commits
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
      }, {} as Record<string, Commit[]>)
  );

  return (
    <div className="space-y-6">
      {groupedCommits.map(([date, dayCommits]) => (
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
                  onGenerateReport(reportTitle, dayCommits);
                }}
              >
                Generate Report
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
                          onClick={() => onViewDetails(commit.project_id.toString(), commit.id)}
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
  );
} 