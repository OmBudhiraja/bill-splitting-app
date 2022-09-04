import FullScreenLoader from '@/components/shared/FullScreenLoader';
import Header from '@/components/shared/Header';
import type { NextPage } from 'next';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const SignInPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(router.query.redirect ? `${router.query.redirect}` : '/');
    }
  }, [status, router]);

  if (status !== 'unauthenticated') {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Head>
        <title>SignIn | Billy</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header withUser={false} unlinkLogo={true} />
        <section className="flex-1 flex flex-col items-center justify-center gap-3">
          <h1 className="text-3xl font-semibold text-gray-700 mb-3">Sign In</h1>
          <button className="btn block" onClick={() => signIn('github', { callbackUrl: '/' })}>
            Sign In With Github
          </button>
          <button className="btn block" onClick={() => signIn('google', { callbackUrl: '/' })}>
            Sign In With Google
          </button>
        </section>
      </div>
    </>
  );
};

export default SignInPage;
