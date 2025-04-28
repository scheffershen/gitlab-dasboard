'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

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
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [selectedDiffIndex, setSelectedDiffIndex] = useState<number>(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzingCommit, setAnalyzingCommit] = useState(false);
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchCommitDetails() {
      try {
        // Read-only API client
        const readApi = axios.create({
          baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
          headers: {
            'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
          }
        });

        const [commitResponse, diffResponse] = await Promise.all([
          readApi.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}`),
          readApi.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}/diff`)
        ]);

        setCommit(commitResponse.data);
        setDiffs(diffResponse.data);

        // Analyze commit
        setAnalyzingCommit(true);
        try {
          const analysisResponse = await fetch('/api/analyze-commit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: commitResponse.data.title,
              message: commitResponse.data.message,
              changes: diffResponse.data.length
            }),
          });
          
          if (!analysisResponse.ok) throw new Error('Failed to analyze commit');
          const analysisData = await analysisResponse.json();
          setAnalysis(analysisData);
        } catch (err) {
          console.error('Failed to analyze commit:', err);
        } finally {
          setAnalyzingCommit(false);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch commit details');
      } finally {
        setLoading(false);
      }
    }

    fetchCommitDetails();
  }, [isOpen, projectId, commitId]);

  const updateCommitMessage = async (newMessage: string) => {
    setIsUpdatingMessage(true);
    try {
      // Write API client with YI token
      const writeApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN_YI,
          'Content-Type': 'application/json'
        }
      });

      const endpointUrl = `${process.env.NEXT_PUBLIC_GITLAB_URL}/api/v4/projects/${projectId}/repository/commits/${commitId}/cherry_pick`;
      
      await writeApi.post(`/api/v4/projects/${projectId}/repository/commits/${commitId}/cherry_pick`, {
        branch: commit.branch_name || 'main',
        message: newMessage
      });

      toast.success("Message du commit mis à jour avec succès!", {
        duration: 60000,
      });
      
      // Refresh commit details using read token
      const readApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_GITLAB_URL,
        headers: {
          'PRIVATE-TOKEN': process.env.NEXT_PUBLIC_GITLAB_TOKEN
        }
      });
      const commitResponse = await readApi.get(`/api/v4/projects/${projectId}/repository/commits/${commitId}`);
      setCommit(commitResponse.data);
    } catch (error: any) {
      console.error('Failed to update commit message:', error);
      
      const gitlabError = error.response?.data?.message || error.response?.data?.error;
      const endpointUrl = `${process.env.NEXT_PUBLIC_GITLAB_URL}/api/v4/projects/${projectId}/repository/commits/${commitId}/cherry_pick`;
      
      if (error.response?.status === 404) {
        toast.error(
          `Erreur 404: L'endpoint de mise à jour n'a pas été trouvé.\n` +
          `URL: ${endpointUrl}\n` +
          `Vérifiez votre version de GitLab.`, 
          {
            duration: 60000,
          }
        );
      } else if (error.response?.status === 403) {
        toast.error(
          `Permission refusée pour: ${endpointUrl}\n\n` +
          "Pour mettre à jour les messages de commit, vous avez besoin de:\n" +
          "1. Être Maintainer ou Owner du projet\n" +
          "2. Avoir un token avec l'accès api write_repository\n" +
          "3. La protection de branche doit autoriser les push",
          {
            duration: 60000,
          }
        );
      } else if (gitlabError) {
        toast.error(
          `Erreur GitLab pour ${endpointUrl}:\n${gitlabError}`, 
          {
            duration: 60000,
          }
        );
      } else {
        toast.error(
          `Échec de la mise à jour du message pour ${endpointUrl}.\nVérifiez vos permissions.`, 
          {
            duration: 60000,
          }
        );
      }
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'w-screen h-screen max-w-none m-0' : 'max-w-4xl'}`}>
        <DialogHeader>
          <div className="flex items-center">
            <div className="flex-none">
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
            </div>
            <DialogTitle className="flex-1 text-center">
              Commit Details
            </DialogTitle>
            <div className="flex-none w-10"></div>
          </div>
        </DialogHeader>

        <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[80vh]'}`}>
          <ScrollArea className="h-full">
            {loading ? (
              <div className="animate-pulse space-y-4 p-4">
                <div className="h-20 bg-muted rounded"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-destructive">{error}</div>
            ) : commit ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left side - Commit Details */}
                      <ScrollArea className="h-[400px] w-full">
                        <div className="pr-4">
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
                              <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                +{commit.stats.additions}
                              </Badge>
                              <Badge variant="destructive">-{commit.stats.deletions}</Badge>
                              <Badge variant="outline">{commit.stats.total} changes</Badge>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* Right side - Analysis Section */}
                      <ScrollArea className="h-[400px] w-full border-l">
                        <div className="pl-6">
                          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                            Commit Analysis
                            {analyzingCommit && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </h4>
                          
                          {analysis && !analyzingCommit && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={analysis.score >= 7 ? "secondary" : analysis.score >= 4 ? "outline" : "destructive"}
                                  className={
                                    analysis.score >= 7 
                                      ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : ""
                                  }
                                >
                                  Score: {analysis.score}/10
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{analysis.analysis}</p>
                              {analysis.betterCommitMessage && (
                                <div className="text-sm mt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <strong className="text-foreground">Suggested Commit Message:</strong>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(analysis.betterCommitMessage, 'text/html');
                                        const textContent = doc.body.textContent || '';
                                        updateCommitMessage(textContent);
                                      }}
                                      disabled={isUpdatingMessage}
                                    >
                                      {isUpdatingMessage ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Mise à jour...
                                        </>
                                      ) : (
                                        'Appliquer la suggestion'
                                      )}
                                    </Button>
                                  </div>
                                  <div 
                                    className="mt-2 p-3 bg-muted rounded-md font-mono text-sm prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ 
                                      __html: analysis.betterCommitMessage || '' 
                                    }}
                                  />
                                  <p className="text-muted-foreground mt-2 text-xs">
                                    {analysis.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
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
                              <span className="font-mono text-sm truncate flex-1">
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
                                <Badge variant="secondary" className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Added
                                </Badge>
                              )}
                              {diffs[selectedDiffIndex].deleted_file && (
                                <Badge variant="destructive">Deleted</Badge>
                              )}
                              {diffs[selectedDiffIndex].renamed_file && (
                                <Badge>Renamed</Badge>
                              )}
                              <span className="font-mono text-sm font-medium">
                                {diffs[selectedDiffIndex].new_path}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {diffs[selectedDiffIndex].changes} changes
                            </span>
                          </div>
                        </div>

                        <ScrollArea className="flex-1">
                          <pre className="text-sm font-mono p-4 rounded">
                            {diffs[selectedDiffIndex].diff.split('\n').map((line: string, i: number) => {
                              const isAddition = line.startsWith('+');
                              const isDeletion = line.startsWith('-');
                              const lineNumber = i + 1;

                              return (
                                <div 
                                  key={i} 
                                  className={`flex ${
                                    isAddition 
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                                      : isDeletion 
                                        ? 'bg-destructive/10 text-destructive dark:text-red-400'
                                        : ''
                                  }`}
                                >
                                  <span className="w-12 text-right pr-4 select-none text-muted-foreground border-r border-border mr-4">
                                    {lineNumber}
                                  </span>
                                  <span className="flex-1 whitespace-pre">
                                    {line}
                                  </span>
                                </div>
                              );
                            })}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
} 