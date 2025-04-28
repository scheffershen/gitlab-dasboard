import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type ChartConfig } from '@/components/ui/chart';
import { CHART_COLORS } from '../constants';

interface LineChangeStat {
  name: string;
  value: number;
  fill?: string;
}

interface ActivityLineChangesProps {
  additionsStats: LineChangeStat[];
  deletionsStats: LineChangeStat[];
  chartConfig: ChartConfig;
}

export function ActivityLineChanges({
  additionsStats,
  deletionsStats,
  chartConfig
}: ActivityLineChangesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Changes by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Additions Bar Chart */}
          {additionsStats.length > 0 && (
            <div className='flex flex-col items-center'>
              <h3 className='mb-2 text-lg font-semibold'>Additions by Project</h3>
              <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                <BarChart
                  accessibilityLayer
                  data={additionsStats}
                  layout="vertical"
                  margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
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
                  <Bar dataKey="value" layout="vertical" radius={4}>
                    {additionsStats.map((entry, index) => (
                      <Cell key={`cell-add-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Deletions Bar Chart */}
          {deletionsStats.length > 0 && (
            <div className='flex flex-col items-center'>
              <h3 className='mb-2 text-lg font-semibold'>Deletions by Project</h3>
              <ChartContainer config={chartConfig} className='h-[250px] w-full'>
                <BarChart
                  accessibilityLayer
                  data={deletionsStats}
                  layout="vertical"
                  margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
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
                  <Bar dataKey="value" layout="vertical" radius={4}>
                    {deletionsStats.map((entry, index) => (
                      <Cell key={`cell-del-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 