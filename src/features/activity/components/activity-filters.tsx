import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Project } from '../types';

interface ActivityFiltersProps {
  period: string;
  setPeriod: (value: string) => void;
  selectedProject: string;
  setSelectedProject: (value: string) => void;
  selectedContributor: string;
  setSelectedContributor: (value: string) => void;
  projects: Project[];
  contributors: string[];
  periodOptions: Array<{ value: string; label: string }>;
}

export function ActivityFilters({
  period,
  setPeriod,
  selectedProject,
  setSelectedProject,
  selectedContributor,
  setSelectedContributor,
  projects,
  contributors,
  periodOptions
}: ActivityFiltersProps) {
  return (
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
              {periodOptions.map((option) => (
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
  );
} 