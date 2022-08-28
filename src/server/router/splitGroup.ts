import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

export const splitGroupRouter = createProtectedRouter()
  .query('getmygroups', {
    async resolve({ ctx }) {
      const myGroups = await ctx.prisma.splitGroup.findMany({
        where: {
          participants: {
            some: { id: ctx.session.user.id },
          },
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
          participants: {
            connect: { id: ctx.session.user.id },
          },
        },
        include: { participants: true, _count: true },
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
          participants: {
            connect: { id: ctx.session.user.id },
          },
        },
        include: {
          participants: true,
        },
      });

      return bill;
    },
  });
