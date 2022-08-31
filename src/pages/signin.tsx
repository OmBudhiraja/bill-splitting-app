import FullScreenLoader from '@/components/FullScreenLoader';
import type { NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const SignInPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status !== 'unauthenticated') {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center gap-3">
      SignInPage
      <button className="btn block" onClick={() => signIn(undefined, { callbackUrl: '/' })}>
        Sign In
      </button>
    </div>
  );
};

export default SignInPage;
