'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GitLabEvent {
  created_at: string;
  action_name: string;
}

interface ActivityChartProps {
  data: GitLabEvent[];
}

export default function ActivityChart({ data }: ActivityChartProps) {
  // Group events by date
  const eventsByDate = data.reduce((acc: { [key: string]: number }, event) => {
    const date = format(parseISO(event.created_at), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Sort dates and prepare chart data
  const sortedDates = Object.keys(eventsByDate).sort();

  const chartData = {
    labels: sortedDates.map(date => format(parseISO(date), 'MMM dd')),
    datasets: [
      {
        label: 'Activity',
        data: sortedDates.map(date => eventsByDate[date]),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activity Over Time'
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <Line data={chartData} options={options} />
    </div>
  );
} 