import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { StarIcon } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from './user-auth-form';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Gitlab Dashboard
            </h1>
            <p className='text-sm text-muted-foreground'>
              Enter your email below to create your account
            </p>
          </div>
          <UserAuthForm />
        </div>
      </div>
    </div>    
  );
}
