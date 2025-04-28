import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type ChartConfig } from '@/components/ui/chart';
import { CHART_COLORS } from '../constants';

interface ProjectStat {
  name: string;
  value: number;
  fill?: string;
}

interface ContributorStat {
  name: string;
  commits: number;
}

interface ActivityStatisticsProps {
  projectStats: ProjectStat[];
  contributorStats: ContributorStat[];
  chartConfig: ChartConfig;
}

export function ActivityStatistics({
  projectStats,
  contributorStats,
  chartConfig
}: ActivityStatisticsProps) {
  return (
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
                data={projectStats.filter(p => p.value > 0)}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 40,
                  top: 5,
                  bottom: 5,
                }}
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
                <Bar dataKey="value" layout="vertical" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Contributor Commits Bar Chart */}
          <div className='flex flex-col items-center'>
            <h3 className='mb-2 text-lg font-semibold'>Commits by Contributor</h3>
            <ChartContainer config={chartConfig} className='h-[250px] w-full'>
              <BarChart
                accessibilityLayer
                data={contributorStats.slice(0, 10)}
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
                  width={100}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <XAxis dataKey='commits' type='number' hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='line' />} />
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
  );
} 