import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/debug/projects');
} 