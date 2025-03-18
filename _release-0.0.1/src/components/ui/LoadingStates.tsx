export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2"></div>
    </div>
  );
}

export function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex items-center">
      <span className="animate-ping h-2 w-2 rounded-full bg-indigo-600 opacity-75"></span>
      <span className="animate-ping h-2 w-2 rounded-full bg-indigo-600 opacity-75 ml-1"></span>
      <span className="animate-ping h-2 w-2 rounded-full bg-indigo-600 opacity-75 ml-1"></span>
    </span>
  );
} 