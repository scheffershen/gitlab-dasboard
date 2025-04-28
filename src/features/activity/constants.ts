import { type ChartConfig } from "@/components/ui/chart"; // Adjust import path if necessary

export const PERIOD_OPTIONS = [
  { label: '24 heures', value: '1', default: true },
  { label: '7 jours', value: '7'},
  { label: '14 jours', value: '14' },
  { label: '30 jours', value: '30' },
  { label: '60 jours', value: '60' },
  { label: '3 mois', value: '90' },
  { label: '6 mois', value: '180' },
  { label: '1 an', value: '365' },
  { label: '2 ans', value: '730' }
];

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)',
];

export const chartConfig = {
  commits: {
    label: 'Commits'
  },
  project: {
    label: 'Project',
    color: 'var(--chart-1)'
  },
  contributor: {
    label: 'Contributor',
    color: 'var(--chart-2)'
  },
  additions: {
    label: 'Additions',
    color: 'hsl(var(--chart-green))'
  },
  deletions: {
    label: 'Deletions',
    color: 'hsl(var(--chart-red))'
  }
} satisfies ChartConfig;