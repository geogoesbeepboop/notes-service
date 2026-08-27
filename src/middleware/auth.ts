import type { Middleware } from "../pipeline.ts";

// In the real system tokens are validated against the identity service;
// for local development a single static token is accepted.
const VALID_TOKENS = new Set(["dev-token-123", "dev-token-456"]);

const PUBLIC_PATHS = new Set(["/health"]);

/** Rejects requests that do not carry a valid bearer token. */
export const auth: Middleware = async (ctx, next) => {
  const path = (ctx.req.url ?? "/").split("?")[0];
  if (PUBLIC_PATHS.has(path)) {
    await next();
    return;
  }

  const header = ctx.req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!VALID_TOKENS.has(token)) {
    ctx.res.statusCode = 401;
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  ctx.clientToken = token;
  await next();
};
