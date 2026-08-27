import type { IncomingMessage } from "node:http";
import type { Middleware } from "./pipeline.ts";
import { HttpError } from "./pipeline.ts";

interface Note {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

const notes: Note[] = [
  { id: 1, title: "welcome", body: "first note", createdAt: new Date(0).toISOString() },
];
let nextId = 2;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function parseNotePayload(raw: string): Promise<{ title: string; body: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "request body must be valid JSON");
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj?.title !== "string" || obj.title.trim().length === 0) {
    throw new HttpError(400, "field 'title' is required and must be a non-empty string");
  }
  if (obj.body !== undefined && typeof obj.body !== "string") {
    throw new HttpError(400, "field 'body' must be a string when present");
  }
  return { title: obj.title.trim(), body: typeof obj.body === "string" ? obj.body : "" };
}

function sendJson(ctx: Parameters<Middleware>[0], status: number, payload: unknown): void {
  ctx.res.statusCode = status;
  ctx.res.setHeader("Content-Type", "application/json");
  ctx.res.end(JSON.stringify(payload));
}

/** Terminal middleware: matches the route table and produces the response. */
export const routes: Middleware = async (ctx) => {
  const method = ctx.req.method ?? "GET";
  const path = (ctx.req.url ?? "/").split("?")[0];

  if (method === "GET" && path === "/health") {
    sendJson(ctx, 200, { status: "ok" });
    return;
  }

  if (method === "GET" && path === "/api/notes") {
    sendJson(ctx, 200, { notes });
    return;
  }

  if (method === "POST" && path === "/api/notes") {
    const raw = await readBody(ctx.req);
    const payload = await parseNotePayload(raw);
    const note: Note = {
      id: nextId++,
      title: payload.title,
      body: payload.body,
      createdAt: new Date().toISOString(),
    };
    notes.push(note);
    sendJson(ctx, 201, { note });
    return;
  }

  throw new HttpError(404, `no route for ${method} ${path}`);
};
