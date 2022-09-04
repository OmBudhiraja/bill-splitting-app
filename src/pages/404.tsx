/* eslint-disable @next/next/no-img-element */
import Header from '@/components/shared/Header';
import type { NextPage } from 'next';
import Link from 'next/link';

const NotFoundPage: NextPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header withUser={false} />
      <div className="flex-1 flex flex-col gap-5 items-center justify-center p-2">
        <img
          className="w-full max-w-sm"
          src="/not-found-illustration.png"
          alt="Not Found Illustration"
        />
        <p className="text-xl font-medium text-gray-600 text-center">
          Oops! This page doesn&apos;t exist <br /> or has been Removed{' '}
        </p>
        <Link href="/">
          <a className="btn">Go Back Home</a>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
