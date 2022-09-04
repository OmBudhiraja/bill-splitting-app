/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { inferQueryOutput, trpc } from '@/utils/trpc';
import Header from '@/components/shared/Header';
import FullScreenLoader from '@/components/shared/FullScreenLoader';
import { FormEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AiOutlinePlus as AddIcon, AiFillInfoCircle as InfoIcon } from 'react-icons/ai';
import { HiUserGroup as UsersIcon, HiUser as SingleUserIcon } from 'react-icons/hi';
import { Modal, OpenModalButton } from '@/components/shared/Modal';
import Link from 'next/link';
import Head from 'next/head';

const Home: NextPage = () => {
  const { data, isLoading } = trpc.useQuery(['billGroup.getMyGroups']);

  const newGroupModalId = 'create-new-group';

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [status, router]);

  if (status !== 'authenticated' || isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Head>
        <title>Dashboard | Billy</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-xl m-auto px-5 py-10 flex flex-col">
          {data && (
            <>
              {data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 h-full">
                  <img
                    className="w-full max-w-[25rem] mb-7"
                    src="/empty_screen_illustration.svg"
                    alt="Empty Screen Illustration"
                  />
                  <p className="text-xl text-gray-600">
                    Looks like You don&apos;t have any Group yet.
                  </p>
                  <OpenModalButton modalId={newGroupModalId}>
                    Create Your First Group
                  </OpenModalButton>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl">Your Groups</h1>
                  <section className="flex flex-col gap-5 mt-5">
                    {data && data.map((group) => <GroupCard group={group} key={group.id} />)}
                  </section>
                </>
              )}
            </>
          )}
        </main>

        {data && data.length > 0 && (
          <OpenModalButton
            title="Add new Group"
            modalId={newGroupModalId}
            extraClasses="fixed bottom-10 right-10 md:bottom-16 md:right-16 btn-circle"
          >
            <span className="sr-only">Add New Group</span>
            <AddIcon size={26} />
          </OpenModalButton>
        )}
        <Modal title="Create a new Group" modalId={newGroupModalId}>
          <CreateNewGroup />
        </Modal>
      </div>
    </>
  );
};

const CreateNewGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');

  const { mutate, isLoading } = trpc.useMutation('billGroup.create', {
    onSuccess: (data) => {
      router.push(`/group/details/${data.id}`);
    },
  });

  const router = useRouter();

  const submitHandler: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (groupName.trim().length > 2) {
      mutate({ name: groupName });
    }
  };

  return (
    <form onSubmit={submitHandler} className="grid gap-5 w-full px-0 py-3 sm:p-3 md:p-5">
      <div>
        <label htmlFor="groupName" className="font-medium">
          Add a Group Name
        </label>
        <input
          id="groupName"
          disabled={isLoading}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
          minLength={3}
          type="text"
          placeholder="Goa Trip"
          className="input input-bordered w-full mt-3"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`btn w-fit ${isLoading ? 'loading' : ''}`}
      >
        Create New Group
      </button>
      <div className="flex items-center gap-2 text-gray-500">
        <InfoIcon />
        <span>You can share Invite Link to add member in the Group</span>
      </div>
    </form>
  );
};

type Group = inferQueryOutput<'billGroup.getMyGroups'>[number];

const GroupCard: React.FC<{ group: Group }> = ({ group }) => {
  return (
    <Link href={`/group/details/${group.id}`}>
      <a className="bg-gray-200 p-5 rounded-lg flex items-center gap-2 cursor-pointer">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{group.name}</h3>
          <p className="text-sm mt-1 font-normal">
            Created by{' '}
            <span className="font-medium block sm:inline">
              {group.UsersOnGroup.find((u) => u.user.id === group.creatorId)?.user.name}
            </span>
          </p>
          <p className="text-sm font-normal hidden sm:block">
            on{' '}
            <span className="font-normal">
              {group.createdAt.toLocaleString('en', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })}
            </span>
          </p>
          <p className="flex items-center gap-2 mt-2 text-gray-600">
            {group._count.UsersOnGroup > 1 ? <UsersIcon /> : <SingleUserIcon />}
            {group._count.UsersOnGroup}
          </p>
        </div>
        <div>
          <p className="text-sm">Total Expenses</p>
          <p className="text-center text-lg font-semibold"> ₹ {group.totalExpenses}</p>
        </div>
      </a>
    </Link>
  );
};

export default Home;
