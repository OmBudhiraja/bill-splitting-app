import type { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { trpc } from '@/utils/trpc';
import Header from '@/components/Header';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  // const { data, isLoading, error } = trpc.useQuery(['billGroup.getmygroups']);
  // console.log(data, isLoading, error);

  const { mutate } = trpc.useMutation('billGroup.create');

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Header />
      <button onClick={() => mutate({ name: 'My first group' })}>Add new</button>
    </>
  );
};

export default Home;
