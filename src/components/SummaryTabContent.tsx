/* eslint-disable @next/next/no-img-element */
import type React from 'react';
import { useSession } from 'next-auth/react';
import { ImSpinner2 as SpinnerIcon } from 'react-icons/im';
import { AiOutlineArrowRight as RightArrowIcon } from 'react-icons/ai';
import { trpc } from '@/utils/trpc';
import { Modal, OpenModalButton } from './shared/Modal';

const SummaryTabContent: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { data: records, isLoading } = trpc.useQuery([
    'activity.getMySettlementRecords',
    { groupId },
  ]);

  const { data: session } = useSession();

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

  return (
    <main className="p-5 mt-8 flex flex-col gap-5">
      <>
        {records.netDebt.length === 0 ? (
          <>
            <h3>You don&apos;t have any summary</h3>
          </>
        ) : (
          <>
            {records.netDebt.map((r) => (
              <div
                key={r.id}
                className="bg-gray-200 px-3 py-5 sm:p-5 rounded-lg flex justify-between items-center gap-3 sm:gap-4 cursor-default border-2 border-gray-600"
              >
                <section className=" flex-1 flex gap-2 items-center">
                  {((src: string, alt: string) => (
                    <img
                      src={src}
                      className="bg-gray-500 hidden sm:block h-10 w-10 rounded-full"
                      alt={alt}
                    />
                  ))(
                    r.amount > 0
                      ? r.image ?? '/default-user.png'
                      : session?.user?.image ?? '/default-user.png',
                    r.amount > 0 ? r.name ?? '' : session?.user?.name ?? 'Unnamed'
                  )}
                  <div>
                    {r.amount > 0 ? <p>{r.name}</p> : <p title={session?.user?.name ?? ''}>You</p>}
                    <p>
                      <strong>₹ {Math.abs(r.amount)}</strong>
                    </p>
                  </div>
                </section>
                <section className="flex flex-col items-center justify-end gap-2">
                  <RightArrowIcon className="text-blue-700" size={24} />
                  {r.amount < 0 && (
                    <SettlementButtonWithModal
                      amount={Math.abs(r.amount)}
                      groupId={groupId}
                      userId={r.id}
                      userName={r.name ?? ''}
                    />
                  )}
                </section>
                <section className=" flex-1 flex gap-2 justify-end items-center">
                  <div className="text-right">
                    {r.amount < 0 ? <p>{r.name}</p> : <p title={session?.user?.name ?? ''}>You</p>}
                  </div>
                  {((src: string, alt: string) => (
                    <img
                      src={src}
                      className="bg-gray-500 hidden sm:block h-10 w-10  rounded-full"
                      alt={alt}
                    />
                  ))(
                    r.amount > 0
                      ? session?.user?.image ?? '/default-user.png'
                      : r.image ?? '/default-user.png',
                    r.amount > 0 ? session?.user?.name ?? '' : r.name ?? 'Unnamed'
                  )}
                </section>
              </div>
            ))}
          </>
        )}
      </>
    </main>
  );
};

const SettlementButtonWithModal: React.FC<{
  userId: string;
  userName: string;
  groupId: string;
  amount: number;
}> = ({ userId, userName, groupId, amount }) => {
  const settlePaymentModalId = 'settle-payment';

  const { data: session } = useSession();

  const trpcContext = trpc.useContext();

  const { mutate, isLoading } = trpc.useMutation('activity.createSettlement', {
    onSuccess: () => {
      ((document.getElementById(settlePaymentModalId) as HTMLInputElement) ?? {}).checked = false;
      trpcContext.invalidateQueries('activity.getActivity');
      trpcContext.invalidateQueries('activity.getMySettlementRecords');
    },
    onMutate: (data) => {
      trpcContext.setQueryData(['activity.getMySettlementRecords'], (prev) => {
        return {
          myTotalExpenditure: prev?.myTotalExpenditure ?? 0,
          netDebt: (prev?.netDebt ?? []).filter((rec) => rec.id === data.recievedById),
        };
      });
    },
  });

  const createSettlement = () => {
    session &&
      session.user &&
      mutate({ groupId, paidFromId: session.user.id, recievedById: userId, amount });
  };

  return (
    <>
      <OpenModalButton extraClasses="btn-xs" modalId={settlePaymentModalId}>
        Settle
      </OpenModalButton>
      <Modal modalId={settlePaymentModalId} title={`Settle Account with the User`}>
        <div className="flex flex-col gap-5 justify-start w-full items-start mt-4">
          <p>Cleared your Account with {userName}?</p>
          <button
            disabled={isLoading}
            onClick={createSettlement}
            className={`btn btn-sm ${isLoading ? 'loading' : ''}`}
          >
            Mark as Paid
          </button>
        </div>
      </Modal>
    </>
  );
};

export default SummaryTabContent;
