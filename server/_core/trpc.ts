import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logSecurityEvent } from "./securityLogger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      // SECURITY: Log privilege escalation attempt
      logSecurityEvent({
        type: 'privilege_escalation_attempt',
        userId: ctx.user?.id,
        openId: ctx.user?.openId,
        success: false,
        reason: 'Non-admin user attempted to access admin endpoint',
        details: {
          userRole: ctx.user?.role || 'none',
          endpoint: 'admin_procedure',
        },
      });
      
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    // SECURITY: Log successful admin action
    logSecurityEvent({
      type: 'admin_action',
      userId: ctx.user.id,
      openId: ctx.user.openId,
      success: true,
      details: {
        procedure: 'admin_endpoint_accessed',
      },
    });

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
