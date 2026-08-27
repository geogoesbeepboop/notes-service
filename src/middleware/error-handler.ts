import type { Middleware } from "../pipeline.ts";
import { HttpError } from "../pipeline.ts";

/**
 * Catches anything thrown further down the chain and turns it into a
 * consistent JSON error shape: { "error": "<message>", "requestId": "<id>" }.
 * Unknown errors become a 500 with a generic message.
 */
export const errorHandler: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof HttpError ? err.message : "internal server error";

    if (!ctx.res.headersSent) {
      ctx.res.statusCode = status;
      ctx.res.setHeader("Content-Type", "application/json");
    }
    if (!ctx.res.writableEnded) {
      ctx.res.end(JSON.stringify({ error: message, requestId: ctx.requestId ?? null }));
    }

    if (status >= 500) {
      console.error(`[${ctx.requestId ?? "-"}] unhandled error:`, err);
    }
  }
};
