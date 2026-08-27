import type { IncomingMessage, ServerResponse } from "node:http";

export interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  /** Correlation id attached by the request-id middleware. */
  requestId?: string;
  /** Client identity attached by the auth middleware. */
  clientToken?: string;
  /** Scratch space for middleware to share request-scoped data. */
  state: Record<string, unknown>;
}

export type Next = () => Promise<void>;
export type Middleware = (ctx: Ctx, next: Next) => void | Promise<void>;

/** An error carrying an HTTP status; the error handler turns these into JSON responses. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * Composes a stack of middleware into a single runner.
 * Each middleware receives the ctx and a `next` that invokes the rest of the chain.
 */
export function compose(stack: Middleware[]) {
  return async function run(ctx: Ctx): Promise<void> {
    let lastCalled = -1;

    async function dispatch(i: number): Promise<void> {
      if (i <= lastCalled) {
        throw new Error("next() called multiple times in one middleware");
      }
      lastCalled = i;
      const fn = stack[i];
      if (!fn) return;
      await fn(ctx, async () => {
        dispatch(i + 1);
      });
    }

    await dispatch(0);
  };
}

export class App {
  private stack: Middleware[] = [];

  use(fn: Middleware): this {
    this.stack.push(fn);
    return this;
  }

  handler() {
    return compose(this.stack);
  }
}
