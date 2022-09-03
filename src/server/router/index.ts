// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { splitGroupRouter } from './splitGroup';
import { activityRouter } from './activity';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('billGroup.', splitGroupRouter)
  .merge('activity.', activityRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
