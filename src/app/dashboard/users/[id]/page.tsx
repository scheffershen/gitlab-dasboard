import UserContributions from '@/components/UserContributions';
import { getGitlabData } from '@/lib/gitlab';

export default async function UserPage({ params }: { params: { id: string } }) {
  const [userData, contributions] = await Promise.all([
    getGitlabData('users/details', { userId: params.id }),
    getGitlabData('users/contributions', { userId: params.id })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <img
          src={userData.avatar_url}
          alt={userData.name}
          className="h-16 w-16 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {userData.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{userData.email}</p>
        </div>
      </div>

      <UserContributions
        userId={params.id}
        contributions={contributions.data}
        userStats={contributions.stats}
      />
    </div>
  );
} 