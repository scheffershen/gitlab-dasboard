// src/features/activity/types/commitTypes.ts
export interface CommitStats {
    additions: number;
    deletions: number;
    total: number;
    files_changed: number;
    files_added: number;
    files_deleted: number;
    files_modified: number;
  }
  
  export interface Commit {
    id: string;
    project_id: number;
    project_name: string;
    author_name: string;
    created_at: string;
    title: string;
    branch_name: string;
    is_default_branch: boolean;
    stats: CommitStats;
  }
  
  export interface CommitData {
    commits: Commit[];
    timestamp: string;
  }