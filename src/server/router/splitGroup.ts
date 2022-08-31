import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

export const splitGroupRouter = createProtectedRouter()
  .query('getmygroups', {
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
      });

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const bill = await ctx.prisma.splitGroup.update({
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

      return bill;
    },
  });
