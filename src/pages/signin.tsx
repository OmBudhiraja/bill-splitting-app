/* eslint-disable @next/next/no-img-element */
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
        <section className="flex-1 flex flex-col sm:flex-row mb-5 mt-6 md:mt-10 items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 py-0">
            <h1 className="text-4xl md:text-6xl text-center font-semibold md:leading-tight">
              Split the bill{' '}
              <span className="text-[#261f82]">
                {' '}
                <br /> not the friendship
              </span>
            </h1>

            <p className="text-lg text-center text-gray-600">
              Manage your Bills with Friends Effortlessly
              <br />
              Sign Up to access the App
            </p>

            <button
              className="btn btn-primary min-w-[10rem]"
              onClick={() => signIn(undefined, { callbackUrl: '/' })}
            >
              Get Started
            </button>
          </div>
          <div className="flex-1 px-10 sm:px-0 max-w-sm sm:max-w-none">
            <img className="h-full w-full bg-contain" src="/app-demo.svg" alt="app-demo" />
          </div>
        </section>
      </div>
    </>
  );
};

export default SignInPage;
