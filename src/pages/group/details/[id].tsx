/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';
import type React from 'react';
import { useEffect, useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  AiFillCopy as CopyIcon,
  AiFillEdit as EditIcon,
  AiOutlineCheck as SaveIcon,
} from 'react-icons/ai';
import Header from '@/components/shared/Header';
import FullScreenLoader from '@/components/shared/FullScreenLoader';
import ActivityTabContent from '@/components/ActivityTabContent';
import SummaryTabContent from '@/components/SummaryTabContent';
import { toast } from 'react-toastify';
import { User, UsersOnGroup, type SplitGroup } from '@prisma/client';
import { Modal, OpenModalButton } from '@/components/shared/Modal';
import Head from 'next/head';
import NotFoundPage from '@/pages/404';

const GroupInvite: NextPage = () => {
  const { query } = useRouter();

  if (!query.id || typeof query.id !== 'string') {
    return <div>No Id</div>;
  }

  return (
    <div>
      <PageContent groupId={query.id} />
    </div>
  );
};

const PageContent: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { data, isLoading, error } = trpc.useQuery(['billGroup.getGroupDetails', { groupId }]);

  const [activeTab, setActiveTab] = useState<'activity' | 'summary'>('activity');

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace({
        pathname: '/signin',
        query: { redirect: `/group/details/${groupId}` },
      });
    }
  }, [status, router, groupId]);

  if (error?.data?.httpStatus === 404) {
    return <NotFoundPage />;
  }
  if (status !== 'authenticated' || isLoading || !data) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <Head>
        <title>{data.name} | Billy</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <GroupDetailsSection groupDetails={data} />
        <main className="flex-1 w-full max-w-xl m-auto px-5 py-10 flex flex-col">
          <div className="tabs tabs-boxed w-fit mx-auto">
            <a
              onClick={() => setActiveTab('activity')}
              className={`tab min-w-[6rem] md:min-w-[10rem] ${
                activeTab === 'activity' ? 'tab-active' : ''
              }`}
            >
              Activity
            </a>
            <a
              onClick={() => setActiveTab('summary')}
              className={`tab min-w-[6rem] md:min-w-[10rem] ${
                activeTab === 'summary' ? 'tab-active' : ''
              }`}
            >
              Your Summary
            </a>
          </div>
          {activeTab === 'activity' && (
            <ActivityTabContent
              groupId={groupId}
              currentUserId={session.user?.id ?? ''}
              groupUsers={data.UsersOnGroup.map((obj) => obj.user)}
            />
          )}
          {activeTab === 'summary' && (
            <SummaryTabContent totalExpenses={data.totalExpenses} groupId={groupId} />
          )}
        </main>
      </div>
    </>
  );
};

type GroupDetails = SplitGroup & {
  UsersOnGroup: (UsersOnGroup & {
    user: User;
  })[];
};

const GroupDetailsSection: React.FC<{ groupDetails: GroupDetails }> = ({ groupDetails }) => {
  const groupDetailsModalId = 'group-details-modal';

  const [enableGroupNameEditing, setEnableGroupNameEditing] = useState(false);
  const [groupName, setGroupName] = useState(groupDetails.name ?? '');

  const { data: session } = useSession();
  const { mutate, isLoading } = trpc.useMutation('billGroup.updateName', {
    onSuccess: (data) => {
      setGroupName(data.name ?? '');
    },
  });

  return (
    <section className="m-4 rounded-lg px-5 py-5 bg-slate-200 text-gray-900 flex items-center gap-3 justify-between">
      <h3 className="text-xl font-semibold line-clamp-1 cursor-default">{groupName}</h3>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <OpenModalButton modalId={groupDetailsModalId} extraClasses="btn-ghost btn-active btn-sm">
          Group Details
        </OpenModalButton>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/group/invite?id=${groupDetails.id}`
            );
            toast.info('Link Copied to Clipboard', { position: 'bottom-center' });
          }}
          className="btn btn-sm flex items-center gap-2"
        >
          Invite Users
          <CopyIcon className="hidden sm:block" size={20} />
        </button>
      </div>
      <Modal title="Group Details" modalId={groupDetailsModalId}>
        <section className="px-0 py-3 sm:p-3 md:p-5 w-full">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <div className="input-group rounded-lg">
              <input
                disabled={!enableGroupNameEditing || isLoading}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                type="text"
                placeholder="Road Trip"
                className="input input-bordered w-full"
              />
              <div
                className="tooltip tooltip-left"
                data-tip={
                  session?.user?.id !== groupDetails.creatorId
                    ? 'Only Group Creator can edit Name'
                    : 'Click to edit Name'
                }
              >
                <button
                  disabled={isLoading || session?.user?.id !== groupDetails.creatorId}
                  className={`btn btn-square ${isLoading ? 'loading' : ''}`}
                  onClick={() => {
                    if (enableGroupNameEditing) {
                      if (groupName.length > 2) {
                        mutate({ groupId: groupDetails.id, name: groupName });
                        setEnableGroupNameEditing(false);
                      } else {
                        toast.error('Group Name lenght should be atleast 3');
                      }
                    } else {
                      setEnableGroupNameEditing(true);
                    }
                  }}
                >
                  {!isLoading ? <>{enableGroupNameEditing ? <SaveIcon /> : <EditIcon />}</> : ''}
                </button>
              </div>
            </div>
          </div>
          <hr className="mt-6 mb-4" />
          <div>
            Total expenses: <strong>₹ {groupDetails.totalExpenses}</strong>
          </div>
          <hr className="my-4" />

          <div className="flex flex-col gap-3 mt-5">
            <p>All Users:</p>
            {groupDetails.UsersOnGroup.map((u) => (
              <div key={u.user.id} className="flex p-2 rounded-md gap-5 bg-gray-200">
                <img
                  className="h-10 w-10 rounded-full overflow-hidden bg-gray-500"
                  src={u.user.image ?? '/default-user.png'}
                  alt={u.user.name ?? ''}
                />
                <div>
                  <h4>{u.user.name}</h4>
                  <p className="text-sm text-gray-600">{u.user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Modal>
    </section>
  );
};

export default GroupInvite;
