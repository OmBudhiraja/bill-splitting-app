/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';
import { type User } from '@prisma/client';

export enum ActivityType {
  TRANSACTION = 'TRANSACTION',
  SETTLEMENT = 'SETTLEMENT',
}

function mergeWithSameId<S extends (User & { amount: number })[]>(arr: S): S {
  return arr.reduce((acc, cur) => {
    const index = acc.findIndex((r) => r.id === cur.id);
    if (index >= 0 && typeof acc[index] !== undefined) {
      /** NOTE: Typescript is weird sometimes */
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      acc[index]!.amount += cur.amount;
    } else {
      acc.push(cur);
    }
    return acc;
  }, [] as unknown as S);
}

export const activityRouter = createProtectedRouter()
  .query('getActivity', {
    input: z.object({
      groupId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const userInGroup = await ctx.prisma.usersOnGroup.findFirst({
        where: {
          splitGroupId: input.groupId,
          userId: ctx.session.user.id,
        },
      });

      if (!userInGroup) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const allGroupTransactions = (
        await ctx.prisma.transactions.findMany({
          where: {
            splitGroupId: input.groupId,
          },
          include: {
            creator: true,
            payingUser: true,
            splitAmong: true,
          },
        })
      ).map((t) => ({ type: ActivityType.TRANSACTION, data: t }));

      const allGroupSettlements = (
        await ctx.prisma.settlements.findMany({
          where: {
            splitGroupId: input.groupId,
          },
          include: {
            paidFrom: true,
            recievedBy: true,
          },
        })
      ).map((t) => ({ type: ActivityType.SETTLEMENT, data: t }));

      const mergedAndSorted = [...allGroupTransactions, ...allGroupSettlements].sort(
        (a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
      );

      return mergedAndSorted;
    },
  })
  .query('getMySettlementRecords', {
    input: z.object({
      groupId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const allGroupTransactions = await ctx.prisma.transactions.findMany({
        where: {
          splitGroupId: input.groupId,
          splitAmong: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
        include: {
          payingUser: true,
          splitAmong: true,
          _count: true,
        },
      });

      const allGroupSettlements = await ctx.prisma.settlements.findMany({
        where: {
          OR: [{ paidFromId: ctx.session.user.id }, { recievedById: ctx.session.user.id }],
        },
        include: {
          paidFrom: true,
          recievedBy: true,
        },
      });

      const owesToMe: (User & { amount: number })[] = [];

      const iOweThem: (User & { amount: number })[] = [];
      let myTotalExpenditure = 0;

      allGroupTransactions.forEach((t) => {
        const dividedAmount = Math.round(t.amount / t._count.splitAmong);
        if (t.payingUserId === ctx.session.user.id) {
          myTotalExpenditure += t.amount;
          t.splitAmong.forEach((u) => {
            u.id !== ctx.session.user.id && owesToMe.push({ amount: dividedAmount, ...u });
          });
        } else {
          iOweThem.push({
            amount: dividedAmount,
            ...t.payingUser,
          });
        }
      });

      const owesToMeMerged = mergeWithSameId(owesToMe);
      const iOweThemMerged = mergeWithSameId(iOweThem).map((r) => ({
        ...r,
        amount: -Math.abs(r.amount),
      }));

      const debtBeforeSettlement = mergeWithSameId([...owesToMeMerged, ...iOweThemMerged]).filter(
        (r) => r.amount !== 0
      );

      myTotalExpenditure += debtBeforeSettlement.reduce((acc, cur) => acc + -cur.amount, 0);

      const netDebt = debtBeforeSettlement
        .map((record) => {
          return allGroupSettlements
            .filter(
              (settlement) =>
                record.id === settlement.paidFromId || record.id === settlement.recievedById
            )
            .reduce(
              (acc, settlementWithUser) => {
                if (record.id === settlementWithUser.paidFromId) {
                  return {
                    ...acc,
                    amount: record.amount - settlementWithUser.amount,
                  };
                } else {
                  return {
                    ...acc,
                    amount: record.amount + settlementWithUser.amount,
                  };
                }
              },
              { ...record } as User & {
                amount: number;
              }
            );
        })
        .filter((rec) => rec.amount !== 0);

      return { netDebt, myTotalExpenditure };
    },
  })
  .mutation('createTransaction', {
    input: z.object({
      groupId: z.string(),
      name: z.string(),
      amount: z.number().min(1),
      splitEqually: z.boolean(),
      payingUserId: z.string(),
      splitAmong: z.array(z.string()),
    }),
    async resolve({ ctx, input }) {
      if (!input.splitEqually && input.splitAmong.length < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Atleast Select two Users to split amount between.',
        });
      }

      const userInGroup = await ctx.prisma.usersOnGroup.findFirst({
        where: {
          splitGroupId: input.groupId,
          userId: ctx.session.user.id,
        },
      });

      if (!userInGroup) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const transaction = await ctx.prisma.transactions.create({
        data: {
          splitGroupId: input.groupId,
          name: input.name,
          amount: input.amount,
          creatorId: ctx.session.user.id,
          payingUserId: input.payingUserId,
          splitEqually: input.splitEqually,
          splitAmong: {
            connect: input.splitAmong.map((u) => ({ id: u })),
          },
        },
        include: {
          payingUser: true,
          splitAmong: true,
          creator: true,
        },
      });

      await ctx.prisma.splitGroup.update({
        where: {
          id: input.groupId,
        },
        data: {
          totalExpenses: {
            increment: input.amount,
          },
        },
      });

      return transaction;
    },
  })
  .mutation('createSettlement', {
    input: z.object({
      groupId: z.string(),
      amount: z.number().min(1),
      paidFromId: z.string(),
      recievedById: z.string(),
    }),
    async resolve({ ctx, input }) {
      const userInGroup = await ctx.prisma.usersOnGroup.findFirst({
        where: {
          splitGroupId: input.groupId,
          userId: ctx.session.user.id,
        },
      });

      if (!userInGroup) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const settlement = await ctx.prisma.settlements.create({
        data: {
          amount: input.amount,
          splitGroupId: input.groupId,
          paidFromId: input.paidFromId,
          recievedById: input.recievedById,
        },
      });

      return settlement;
    },
  });
