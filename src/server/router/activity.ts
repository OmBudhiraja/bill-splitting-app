import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

export enum ActivityType {
  TRANSACTION = 'TRANSACTION',
  SETTLEMENT = 'SETTLEMENT',
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
      const allGroupTransactions = ctx.prisma.transactions.findMany({
        where: {
          splitGroupId: input.groupId,
          splitAmong: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
        include: {
          splitAmong: true,
        },
      });

      return allGroupTransactions;
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
      recievedFromId: z.string(),
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
          recievedFromId: input.recievedFromId,
        },
      });

      return settlement;
    },
  });
