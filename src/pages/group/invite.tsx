import type { NextPage } from 'next';
import type React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { useSession } from 'next-auth/react';
import FullScreenLoader from '@/components/shared/FullScreenLoader';

const PageContent: React.FC<{ id: string }> = ({ id }) => {
  const { mutate } = trpc.useMutation('billGroup.addPerson', {
    onSuccess: (data) => {
      router.replace(`/group/details/${data.id}`);
    },
  });

  const router = useRouter();
  const { status } = useSession({ required: true });

  useEffect(() => {
    if (status === 'loading') return;

    mutate({ groupId: id });
  }, [id, mutate, status]);

  return <FullScreenLoader />;
};

const GroupInvite: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.query.id || typeof router.query.id !== 'string') {
      router.replace('/');
    }
  }, [router]);

  if (!router.query.id || typeof router.query.id !== 'string') {
    return null;
  }

  return (
    <div>
      <PageContent id={router.query.id} />
    </div>
  );
};

export default GroupInvite;
