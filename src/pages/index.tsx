import type { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { inferQueryOutput, trpc } from '@/utils/trpc';
import Header from '@/components/Header';
import FullScreenLoader from '@/components/FullScreenLoader';
import { FormEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AiOutlinePlus as AddIcon, AiFillInfoCircle as InfoIcon } from 'react-icons/ai';
import { Modal, OpenModalButton } from '@/components/Modal';

const Home: NextPage = () => {
  const { data, isLoading, error } = trpc.useQuery(['billGroup.getMyGroups']);
  console.log(data, isLoading, error);

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
      <Header />
      <main>{data && data.map((group) => <GroupCard group={group} key={group.id} />)}</main>
      <OpenModalButton modalId="create-new-group">
        <AddIcon size={26} />
      </OpenModalButton>
      <Modal title="Create a new Group" modalId="create-new-group">
        <CreateNewGroup />
      </Modal>
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
  return <div>{group.name}</div>;
};

export default Home;
