/* eslint-disable @next/next/no-img-element */
import type React from 'react';
import {
  type SplitGroup,
  type UsersOnGroup,
  type Settlements,
  type Transactions,
  type User,
} from '@prisma/client';
import { trpc } from '@/utils/trpc';
import AutoAnimate from './shared/AutoAnimate';
import { Modal, OpenModalButton } from './shared/Modal';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { AiOutlinePlus as AddIcon, AiOutlineInfoCircle as InfoIcon } from 'react-icons/ai';
import { ImSpinner2 as SpinnerIcon } from 'react-icons/im';
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

const ActivityTabContent: React.FC<{
  groupId: string;
  currentUserId: string;
  groupUsers: User[];
}> = ({ groupId, currentUserId, groupUsers }) => {
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
      {activity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <img className="w-full max-w-md" src="/no-activity-illustration.jpg" alt="no-activity" />
          <p className="text-xl text-gray-600 text-center">
            Looks like You don&apos;t have any
            <br />
            Recorded Transaction
          </p>
          <OpenModalButton
            title="Add new Transaction"
            modalId={newTransactionModalId}
            extraClasses=""
          >
            Add Your First Transaction
          </OpenModalButton>
        </div>
      ) : (
        <AutoAnimate className="flex-1 flex flex-col gap-5 mt-8">
          {activity.map((a) => {
            if (a.type === 'SETTLEMENT') {
              return (
                <SettlementCard settlement={a.data as ActivitySettlementRes} key={a.data.id} />
              );
            } else {
              return (
                <TransactionCard transaction={a.data as ActivityTransactionRes} key={a.data.id} />
              );
            }
          })}
        </AutoAnimate>
      )}
      {activity.length > 0 && (
        <OpenModalButton
          title="Add new Transaction"
          modalId={newTransactionModalId}
          extraClasses="fixed bottom-10 right-10 md:bottom-16 md:right-16 btn-circle"
        >
          <span className="sr-only">Add new Transaction</span>
          <AddIcon size={26} />
        </OpenModalButton>
      )}

      <Modal title="Create new Transaction" modalId={newTransactionModalId}>
        <CreateNewTranaction
          currentUserId={currentUserId}
          users={groupUsers}
          groupId={groupId}
          newTransactionModalId={newTransactionModalId}
        />
      </Modal>
    </>
  );
};

const TransactionCard: React.FC<{ transaction: ActivityTransactionRes }> = ({ transaction }) => {
  const { data: session } = useSession();

  return (
    <div className="bg-gray-200 px-3 py-5 sm:p-5 rounded-lg flex items-center gap-3 sm:gap-4 cursor-default">
      <div>
        <img
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-gray-500"
          src={transaction.payingUser.image ?? '/default-user.png'}
          alt={transaction.payingUser.name ?? 'Unnamed'}
        />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">
          {transaction.createdAt.toLocaleString('en', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })}
        </p>
        <h3 title={transaction.name} className="text-xl font-semibold mb- line-clamp-1">
          {transaction.name}
        </h3>
        <p className="text-gray-500 text-sm">
          <span className="font-semibold text-green-800">
            {transaction.payingUser.id === session?.user?.id ? 'You' : transaction.payingUser.name}{' '}
          </span>
          paid for
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div>
          {/* <p className="text-sm">Amount Paid</p> */}
          <p className="text-center text-xl font-semibold text-blue-700"> ₹ {transaction.amount}</p>
        </div>
        <div className="mt-2 flex gap-1">
          {transaction.splitAmong.slice(0, 4).map((u) => (
            <img
              title={u.name ?? 'Unnamed'}
              className="h-6 w-6 rounded-full bg-gray-500 overflow-hidden"
              key={u.id}
              src={u.image ?? '/default-user.png'}
              alt={u.name ?? 'Unnamed'}
            />
          ))}
          {transaction.splitAmong.length > 4 && (
            <div className="h-6 w-6 bg-slate-300 rounded-full flex items-center justify-center text-sm">
              +{transaction.splitAmong.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettlementCard: React.FC<{ settlement: ActivitySettlementRes }> = ({ settlement }) => {
  return (
    <div className="bg-gray-200 border-2 border-blue-500 px-3 py-5 sm:p-5 rounded-lg flex items-center justify-center cursor-default">
      <div className="h-8 w-8 sm:h-10 sm:w-10 ">
        <img
          src={settlement.paidFrom.image ?? '/default-user.png'}
          alt={settlement.paidFrom.name ?? ''}
          className="h-full w-full bg-cover rounded-full overflow-hidden bg-gray-500"
        />
      </div>
      <p className="px-3 sm:px-4 flex-1">
        <strong>{settlement.paidFrom.name} </strong>
        paid
        <strong> ₹ {settlement.amount}</strong> to
        <strong> {settlement.recievedBy.name}</strong>
      </p>
      <div className="h-8 w-8 sm:h-10 sm:w-10 ">
        <img
          src={settlement.recievedBy.image ?? '/default-user.png'}
          alt={settlement.recievedBy.name ?? ''}
          className="h-full w-full bg-cover rounded-full overflow-hidden bg-gray-500"
        />
      </div>
    </div>
  );
};

const CreateNewTranaction: React.FC<{
  groupId: string;
  users: User[];
  currentUserId: string;
  newTransactionModalId: string;
}> = ({ groupId, users, currentUserId, newTransactionModalId }) => {
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [payingUserId, setPayingUserId] = useState(currentUserId);
  const [splitEqually, setSplitEquallt] = useState(true);
  const [selectedUsers, setSeletedUsers] = useState<string[]>([]);

  const trpcContext = trpc.useContext();
  const { data: session } = useSession();

  const { mutate, isLoading } = trpc.useMutation('activity.createTransaction', {
    onMutate: (data) => {
      trpcContext.setQueryData(['billGroup.getGroupDetails'], (prev) => {
        return { ...prev, totalExpenses: prev?.totalExpenses ?? 0 + data.amount } as SplitGroup & {
          UsersOnGroup: (UsersOnGroup & {
            user: User;
          })[];
        };
      });
    },
    onSuccess: (data) => {
      resetForm();
      ((document.getElementById(newTransactionModalId) as HTMLInputElement) ?? {}).checked = false;
      trpcContext.setQueryData(['activity.getActivity'], (prev) => {
        return [{ type: 'TRANSACTION' as ActivityType, data }, ...(prev ?? [])];
      });
      trpcContext.invalidateQueries('billGroup.getGroupDetails');
      trpcContext.invalidateQueries('activity.getActivity');
      trpcContext.invalidateQueries('activity.getMySettlementRecords');
    },
  });

  const submitHandler: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (transactionName.trim().length > 2 && Number(amount) > 1 && payingUserId.length) {
      if (!splitEqually && selectedUsers.length < 2) {
        toast.error('Atleast Select two Users to split amount between.');
        return;
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
    setPayingUserId(currentUserId);
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
            <option value={users.find((u) => u.id === currentUserId)?.id}>You</option>
            {users.map((u) => {
              if (u.id === currentUserId) return null;
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

export default ActivityTabContent;
