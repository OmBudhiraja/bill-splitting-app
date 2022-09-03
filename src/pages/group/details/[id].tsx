/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';
import type React from 'react';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/router';
import { Modal, OpenModalButton } from '@/components/Modal';
import { AiOutlinePlus as AddIcon, AiOutlineInfoCircle as InfoIcon } from 'react-icons/ai';
import { ImSpinner2 as SpinnerIcon } from 'react-icons/im';
import { type Settlements, type Transactions, type User } from '@prisma/client';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useSession } from 'next-auth/react';
import AutoAnimate from '@/components/AutoAnimate';
import { toast } from 'react-toastify';
import { type ActivityType } from '@/server/router/activity';

type ActivityTransactionRes = Transactions & {
  creator: User;
  payingUser: User;
  splitAmong: User[];
};

type ActivitySettlementRes = Settlements & {
  paidFrom: User;
  recievedBy: User;
};

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
  const { data, isLoading } = trpc.useQuery(['billGroup.getGroupDetails', { groupId }]);

  const [activeTab, setActiveTab] = useState<'activity' | 'debt'>('activity');

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace({
        pathname: '/signin',
        query: { redirect: `/group/details/${groupId}` },
      });
    }
  }, [status, router, groupId]);

  if (status !== 'authenticated' || isLoading || !data) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
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
            onClick={() => setActiveTab('debt')}
            className={`tab min-w-[6rem] md:min-w-[10rem] ${
              activeTab === 'debt' ? 'tab-active' : ''
            }`}
          >
            Debt
          </a>
        </div>
        {activeTab === 'activity' && (
          <TransactionTabContent
            groupId={groupId}
            groupCreatorId={data.creatorId}
            groupUsers={data.UsersOnGroup.map((obj) => obj.user)}
          />
        )}
        {activeTab === 'debt' && <DebtTabContent groupId={groupId} />}
      </main>
    </div>
  );
};

const TransactionTabContent: React.FC<{
  groupId: string;
  groupCreatorId: string;
  groupUsers: User[];
}> = ({ groupId, groupCreatorId, groupUsers }) => {
  const { data: activity, isLoading } = trpc.useQuery(['activity.getActivity', { groupId }]);

  const newTransactionModalId = 'create-new-transaction';

  if (isLoading || !activity) {
    return (
      <div className="m-auto">
        <span className="sr-only">Loading...</span>
        <div aria-hidden="true">
          <SpinnerIcon className="text-4xl animate-spin text-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AutoAnimate className="flex-1 flex flex-col gap-5 mt-8">
        {activity.map((a) => {
          if (a.type === 'SETTLEMENT') {
            return <SettlementCard settlement={a.data as ActivitySettlementRes} key={a.data.id} />;
          } else {
            return (
              <TransactionCard transaction={a.data as ActivityTransactionRes} key={a.data.id} />
            );
          }
        })}
      </AutoAnimate>
      <OpenModalButton
        title="Add new Transaction"
        modalId={newTransactionModalId}
        extraClasses="fixed bottom-10 right-10 md:bottom-16 md:right-16 btn-circle"
      >
        <span className="sr-only">Add new Transaction</span>
        <AddIcon size={26} />
      </OpenModalButton>
      <Modal title="Create new Transaction" modalId={newTransactionModalId}>
        <CreateNewTranaction
          groupCreatorId={groupCreatorId}
          users={groupUsers}
          groupId={groupId}
          newTransactionModalId={newTransactionModalId}
        />
      </Modal>
    </>
  );
};

const DebtTabContent: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { data: records, isLoading } = trpc.useQuery([
    'activity.getMySettlementRecords',
    { groupId },
  ]);

  console.log(records);

  if (isLoading || !records) {
    return (
      <div className="m-auto">
        <span className="sr-only">Loading...</span>
        <div aria-hidden="true">
          <SpinnerIcon className="text-4xl animate-spin text-gray-700" />
        </div>
      </div>
    );
  }

  return <div></div>;
};

const TransactionCard: React.FC<{ transaction: ActivityTransactionRes }> = ({ transaction }) => {
  console.log(transaction);

  const { data: session } = useSession();

  return (
    <div className="bg-gray-200 p-5 rounded-lg flex items-center gap-4 cursor-default">
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">
          {transaction.createdAt.toLocaleString('en', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })}
        </p>
        <h3 title={transaction.name} className="text-xl font-semibold mb-1 line-clamp-1">
          {transaction.name}
        </h3>
        <p>
          Paid by:{' '}
          <span className="font-semibold">
            {transaction.payingUser.id === session?.user?.id ? 'You' : transaction.payingUser.name}
          </span>
        </p>
        <div className="mt-2 flex gap-1">
          {transaction.splitAmong.slice(0, 4).map((u) => (
            <img
              title={u.name ?? 'Unnamed'}
              className="h-7 w-7 rounded-full bg-gray-900 overflow-hidden"
              key={u.id}
              src={u.image ?? '/default-user.png'}
              alt={u.name ?? 'Unnamed'}
            />
          ))}
          {transaction.splitAmong.length > 4 && (
            <div className="h-7 w-7 bg-slate-300 rounded-full flex items-center justify-center text-sm">
              +{transaction.splitAmong.length - 4}
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm">Amount Paid</p>
        <p className="text-center text-xl font-semibold"> ₹ {transaction.amount}</p>
      </div>
    </div>
  );
};

const SettlementCard: React.FC<{ settlement: ActivitySettlementRes }> = ({ settlement }) => {
  return <div>{settlement.id}</div>;
};

const CreateNewTranaction: React.FC<{
  groupId: string;
  users: User[];
  groupCreatorId: string;
  newTransactionModalId: string;
}> = ({ groupId, users, groupCreatorId, newTransactionModalId }) => {
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [payingUserId, setPayingUserId] = useState(groupCreatorId);
  const [splitEqually, setSplitEquallt] = useState(true);
  const [selectedUsers, setSeletedUsers] = useState<string[]>([]);

  const trpcContext = trpc.useContext();
  const { data: session } = useSession();

  const { mutate, isLoading } = trpc.useMutation('activity.createTransaction', {
    onSuccess: (data) => {
      resetForm();
      ((document.getElementById(newTransactionModalId) as HTMLInputElement) ?? {}).checked = false;
      trpcContext.setQueryData(['activity.getActivity'], (prev) => {
        return [{ type: 'TRANSACTION' as ActivityType, data }, ...(prev ?? [])];
      });
      trpcContext.invalidateQueries('activity.getActivity');
    },
  });

  const submitHandler: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (transactionName.trim().length > 2 && Number(amount) > 1 && payingUserId.length) {
      if (!splitEqually && selectedUsers.length < 2) {
        toast.error('Atleast Select two Users to split amount between.');
      }
      mutate({
        groupId,
        name: transactionName,
        amount: Number(amount),
        payingUserId,
        splitEqually,
        splitAmong: splitEqually ? users.map((u) => u.id) : selectedUsers,
      });
    }
  };

  const resetForm = () => {
    setTransactionName('');
    setAmount('');
    setPayingUserId(groupCreatorId);
  };

  return (
    <form onSubmit={submitHandler} className="w-full">
      <AutoAnimate className="grid gap-5 w-full px-0 py-3 sm:p-3 md:p-5">
        <div>
          <label htmlFor="groupName" className="font-medium">
            Transaction Name *
          </label>
          <input
            id="groupName"
            disabled={isLoading}
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
            required
            minLength={3}
            type="text"
            placeholder="Hotel Rent"
            className="input input-bordered w-full mt-3"
          />
        </div>

        <div>
          <label htmlFor="amount" className="font-medium">
            Amount *
          </label>
          <label className="input-group mt-3">
            <span>₹</span>
            <input
              id="amount"
              disabled={isLoading}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
              type="number"
              placeholder="5000"
              className="input input-bordered w-full"
            />
          </label>
        </div>

        <div>
          <label htmlFor="amount" className="font-medium">
            Paid By
          </label>
          <select
            value={payingUserId}
            onChange={(e) => setPayingUserId(e.target.value)}
            className="select select-bordered w-full mt-3"
          >
            <option value={users.find((u) => u.id === groupCreatorId)?.id}>You</option>
            {users.map((u) => {
              if (u.id === groupCreatorId) return null;
              return (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center justify-between my-2">
          <div className="flex gap-2 items-center">
            <label htmlFor="splitEquallyToggle" className="font-medium">
              Share Among Everybody
            </label>
            <div
              className="tooltip"
              data-tip="This will automatically split the amount as Users join the Group!"
            >
              <InfoIcon className="" />
            </div>
          </div>

          <input
            id="splitEquallyToggle"
            disabled={isLoading}
            checked={splitEqually}
            onChange={(e) => setSplitEquallt(e.target.checked)}
            type="checkbox"
            className="toggle"
          />
        </div>

        {!splitEqually && (
          <div className="mb-3">
            <p className="font-medium mb-4">Split Among:</p>
            <div className="flex flex-col gap-2 ml-5 max-h-40 overflow-y-auto custom-scrollbar">
              {users
                .sort((a, b) => {
                  if (a.id === session?.user?.id) {
                    return -1;
                  } else if (b.id === session?.user?.id) {
                    return 1;
                  }
                  return 0;
                })
                .map((u) => (
                  <div key={u.id} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeletedUsers((prev) => [...prev, u.id]);
                        } else {
                          setSeletedUsers((prev) => prev.filter((id) => id !== u.id));
                        }
                      }}
                      className="checkbox checkbox-primary"
                      id={`user-checkbox-${u.id}`}
                    />
                    <label htmlFor={`user-checkbox-${u.id}`}>
                      {u.id === session?.user?.id ? 'You' : u.name}
                    </label>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`btn w-fit ${isLoading ? 'loading' : ''}`}
        >
          Record New Transaction
        </button>
      </AutoAnimate>
    </form>
  );
};

export default GroupInvite;
