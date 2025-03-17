const GITLAB_BASE_URL = 'https://gtl.universalmedica.com';
const GITLAB_TOKEN = process.env.NEXT_PUBLIC_GITLAB_TOKEN;

export async function getGitlabData(endpoint: string, params: Record<string, any> = {}) {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(`/api/gitlab/${endpoint}?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
} 