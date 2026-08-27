import type { Middleware } from "../pipeline.ts";

// Keep recent request lines around so they can be inspected while debugging.
export const recentLogs: string[] = [];

/** Logs method, path, status, and duration for every request that reaches it. */
export const logger: Middleware = async (ctx, next) => {
  const start = Date.now();
  await next();
  const line = `[${ctx.requestId ?? "-"}] ${ctx.req.method} ${ctx.req.url} -> ${ctx.res.statusCode} (${Date.now() - start}ms)`;
  recentLogs.push(line);
  console.log(line);
};
