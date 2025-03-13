const GITLAB_BASE_URL = 'https://gtl.universalmedica.com';
const GITLAB_TOKEN = process.env.NEXT_PUBLIC_GITLAB_TOKEN;

export async function getGitlabData(type: string, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${GITLAB_BASE_URL}/api/v4/${type}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'PRIVATE-TOKEN': GITLAB_TOKEN || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GitLab API Error:', error);
    throw new Error(`GitLab API Error: ${response.status}`);
  }

  return response.json();
} 