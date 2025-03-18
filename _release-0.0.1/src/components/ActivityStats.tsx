'use client';

interface Stat {
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

interface ActivityStatsProps {
  stats: Stat[];
}

export default function ActivityStats({ stats }: ActivityStatsProps) {
  const getChangeColor = (type: Stat['changeType']) => {
    switch (type) {
      case 'increase':
        return 'text-green-500';
      case 'decrease':
        return 'text-red-500';
      case 'neutral':
        return 'text-gray-500';
    }
  };

  const getChangeIcon = (type: Stat['changeType']) => {
    switch (type) {
      case 'increase':
        return '↑';
      case 'decrease':
        return '↓';
      case 'neutral':
        return '→';
    }
  };

  return (
    <>
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {stat.name}
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {stat.value}
          </dd>
          {stat.change !== 0 && (
            <p className={`mt-2 flex items-center text-sm ${getChangeColor(stat.changeType)}`}>
              <span className="font-medium">
                {getChangeIcon(stat.changeType)} {stat.change}
              </span>
            </p>
          )}
        </div>
      ))}
    </>
  );
} 