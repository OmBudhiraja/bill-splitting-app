import type { NextPage } from 'next';
import { type FormEventHandler } from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import FullScreenLoader from '@/components/FullScreenLoader';
import { trpc } from '@/utils/trpc';
import Head from 'next/head';

const NewGroup: NextPage = () => {
  const [name, setName] = useState('');

  const { mutate, isLoading } = trpc.useMutation('billGroup.create', {
    onSuccess: (data) => {
      router.push(`/group/details/${data.id}`);
    },
  });

  const { status } = useSession({ required: true });
  const router = useRouter();

  const submitHandler: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (name.trim().length > 2) {
      mutate({ name });
    }
  };

  if (status === 'loading') {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Head>
        <title>New | BillSplitter</title>
      </Head>
      <div className="min-h-screen flex flex-col justify-center items-center gap-5">
        <h1 className="text-2xl">Create a new Group</h1>
        <form onSubmit={submitHandler} className="grid gap-5 w-full max-w-lg">
          <input
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            type="text"
            placeholder="Add a group Name"
            className="input input-bordered w-full "
          />
          <button disabled={isLoading} className="btn w-fit">
            Create New Group
          </button>
        </form>
      </div>
    </>
  );
};

export default NewGroup;
