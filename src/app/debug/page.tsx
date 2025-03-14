'use client';

import Link from 'next/link';

export default function DebugPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">GitLab API Debug</h1>
      
      <Link 
        href="/debug/projects" 
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-4"
      >
        View Projects
      </Link>
      <Link 
        href="/debug/activity" 
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        View Activity
      </Link>
    </div>
  );
} 