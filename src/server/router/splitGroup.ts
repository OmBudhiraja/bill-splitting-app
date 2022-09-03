import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

export const splitGroupRouter = createProtectedRouter()
  .query('getMyGroups', {
    async resolve({ ctx }) {
      const myGroups = await ctx.prisma.splitGroup.findMany({
        where: {
          UsersOnGroup: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          UsersOnGroup: {
            include: {
              user: true,
            },
          },
          _count: true,
        },
      });
      return myGroups;
    },
  })
  .query('getGroupDetails', {
    input: z.object({
      groupId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const group = await ctx.prisma.splitGroup.findFirst({
        where: {
          id: input.groupId,
          UsersOnGroup: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          UsersOnGroup: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return group;
    },
  })
  .mutation('create', {
    input: z.object({
      name: z.string(),
    }),
    async resolve({ ctx, input }) {
      const group = await ctx.prisma.splitGroup.create({
        data: {
          name: input.name,
          creatorId: ctx.session.user.id,
          UsersOnGroup: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          UsersOnGroup: {
            include: {
              user: true,
            },
          },
          _count: true,
        },
      });

      return group;
    },
  })
  .mutation('addPerson', {
    input: z.object({
      groupId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const group = await ctx.prisma.splitGroup.findFirst({
        where: {
          id: input.groupId,
        },
        include: {
          UsersOnGroup: {
            select: { userId: true },
          },
        },
      });

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (group.UsersOnGroup.find((u) => u.userId === ctx.session.user.id)) {
        return group;
      }

      const updatedGroup = await ctx.prisma.splitGroup.update({
        where: {
          id: input.groupId,
        },
        data: {
          UsersOnGroup: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          UsersOnGroup: {
            include: {
              user: true,
            },
          },
          _count: true,
        },
      });

      const allGroupTransactions = await ctx.prisma.transactions.findMany({
        where: {
          splitGroupId: input.groupId,
          splitEqually: true,
        },
      });

      for (const each of allGroupTransactions) {
        await ctx.prisma.transactions.update({
          where: {
            id: each.id,
          },
          data: {
            splitAmong: {
              connect: {
                id: ctx.session.user.id,
              },
            },
          },
        });
      }

      return updatedGroup;
    },
  });
