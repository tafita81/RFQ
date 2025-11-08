import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  opportunities: router({
    list: publicProcedure.query(async () => {
      const { getAllOpportunities } = await import("./db");
      return getAllOpportunities();
    }),
    recent: publicProcedure.query(async () => {
      const { getRecentOpportunities } = await import("./db");
      return getRecentOpportunities(7);
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const { searchOpportunities } = await import("./db");
      return searchOpportunities(input.query);
    }),
    stats: publicProcedure.query(async () => {
      const { getOpportunityStats } = await import("./db");
      return getOpportunityStats();
    }),
  }),
  
  portals: router({
    list: publicProcedure.query(async () => {
      const { getPortalMapping } = await import("./db");
      return getPortalMapping();
    }),
    stats: publicProcedure.query(async () => {
      const { getPortalStats } = await import("./db");
      return getPortalStats();
    }),
  }),

  leads: router({
    list: publicProcedure.query(async () => {
      const { getAllLeads } = await import("./db");
      return getAllLeads();
    }),
    recent: publicProcedure.query(async () => {
      const { getRecentLeads } = await import("./db");
      return getRecentLeads(7);
    }),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const { searchLeads } = await import("./db");
      return searchLeads(input.query);
    }),
    stats: publicProcedure.query(async () => {
      const { getLeadStats } = await import("./db");
      return getLeadStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
