'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CommitDetailsPage({
  params,
}: {
  params: { projectId: string; commitId: string };
}) {
  const router = useRouter();
  const [commit, setCommit] = useState<any>(null);
  const [diffs, setDiffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number>(0);

  useEffect(() => {
    async function fetchCommitDetails() {
      try {
        const api = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const [commitResponse, diffResponse] = await Promise.all([
          api.get(`/api/v4/projects/${params.projectId}/repository/commits/${params.commitId}`),
          api.get(`/api/v4/projects/${params.projectId}/repository/commits/${params.commitId}/diff`)
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
  }, [params.projectId, params.commitId]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Commit Details</h2>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : commit ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium">{commit.title}</h3>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                {commit.message}
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                <span>{commit.author_name}</span>
                <span className="mx-2">•</span>
                <span>{new Date(commit.created_at).toLocaleString()}</span>
              </div>
              {commit.stats && (
                <div className="mt-4 flex space-x-4 text-sm">
                  <Badge variant="secondary">+{commit.stats.additions}</Badge>
                  <Badge variant="destructive">-{commit.stats.deletions}</Badge>
                  <Badge variant="outline">{commit.stats.total} changes</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex h-[calc(100vh-300px)]">
            {/* Left Sidebar - File List */}
            <div className="w-1/3 border-r">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {diffs.map((diff, index) => (
                    <Button
                      key={index}
                      variant={selectedDiffIndex === index ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedDiffIndex(index)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full">
                          {diff.new_file && <div className="w-full h-full bg-emerald-500" />}
                          {diff.deleted_file && <div className="w-full h-full bg-destructive" />}
                          {diff.renamed_file && <div className="w-full h-full bg-blue-500" />}
                          {!diff.new_file && !diff.deleted_file && !diff.renamed_file && (
                            <div className="w-full h-full bg-yellow-500" />
                          )}
                        </div>
                        <span className="font-mono text-sm break-all flex-1 pr-2">
                          {diff.new_path}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {diff.changes} Δ
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Side - Diff Content */}
            <div className="flex-1">
              {diffs.length > 0 && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b bg-muted">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {diffs[selectedDiffIndex].new_file && (
                          <Badge variant="secondary">Added</Badge>
                        )}
                        {diffs[selectedDiffIndex].deleted_file && (
                          <Badge variant="destructive">Deleted</Badge>
                        )}
                        {diffs[selectedDiffIndex].renamed_file && (
                          <Badge>Renamed</Badge>
                        )}
                        <span className="font-mono text-sm font-medium break-all">
                          {diffs[selectedDiffIndex].new_path}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {diffs[selectedDiffIndex].changes} changes
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <pre className="text-sm font-mono bg-muted p-4 rounded whitespace-pre-wrap break-all">
                      {diffs[selectedDiffIndex].diff}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 