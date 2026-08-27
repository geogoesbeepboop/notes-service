import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
import { App, type Ctx } from "./pipeline.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { auth } from "./middleware/auth.ts";
import { requestId } from "./middleware/request-id.ts";
import { logger } from "./middleware/logger.ts";
import { routes } from "./routes.ts";

export function buildApp(): App {
  const app = new App();
  app.use(errorHandler);
  app.use(auth);
  app.use(requestId);
  app.use(logger);
  app.use(routes);
  return app;
}

export function buildServer() {
  const handle = buildApp().handler();
  return createServer((req, res) => {
    const ctx: Ctx = { req, res, state: {} };
    void handle(ctx);
  });
}

// Start listening only when run directly (`node src/server.ts`),
// so tests can import buildServer without binding the port.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  buildServer().listen(port, () => {
    console.log(`notes service listening on http://localhost:${port}`);
  });
}
