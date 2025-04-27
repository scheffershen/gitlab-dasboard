export interface Commit {
  id: string;
  project_id: number;
  project_name: string;
  author_name: string;
  created_at: string;
  title: string;
  branch_name: string;
  is_default_branch: boolean;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
    files_changed: number;
    files_added: number;
    files_deleted: number;
    files_modified: number;
  };
}

export interface CommitData {
  commits: Commit[];
  timestamp: string;
}

export interface PieChartViewBox {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

export interface Project {
  id: number;
  name: string;
  value: number;
}

export interface Contributor {
  name: string;
  commits: number;
}