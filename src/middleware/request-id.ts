import { randomUUID } from "node:crypto";
import type { Middleware } from "../pipeline.ts";

/** Attaches a correlation id to the ctx and echoes it back to the client. */
export const requestId: Middleware = async (ctx, next) => {
  const incoming = ctx.req.headers["x-request-id"];
  ctx.requestId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  ctx.res.setHeader("X-Request-Id", ctx.requestId);
  await next();
};
