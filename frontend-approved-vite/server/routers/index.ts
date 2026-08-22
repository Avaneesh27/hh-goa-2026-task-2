/**
 * Stub AppRouter type — satisfies the tRPC type import in lib/trpc.ts.
 * In this project the real API is the FastAPI backend (ragApi.ts).
 * tRPC calls to /api/trpc will 404 gracefully; they are never invoked
 * by Home.tsx which uses ragApi.ts directly.
 */
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const appRouter = t.router({
  auth: t.router({
    me: t.procedure.query(() => null),
    logout: t.procedure.mutation(() => null),
  }),
});

export type AppRouter = typeof appRouter;
