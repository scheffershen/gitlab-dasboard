import { CardSkeleton } from '@/components/ui/LoadingStates';

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
} 