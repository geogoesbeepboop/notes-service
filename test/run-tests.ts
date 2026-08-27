// Zero-dependency test harness: starts the server on an ephemeral port,
// exercises it over real HTTP, and reports pass/fail.
// Run with: node test/run-tests.ts
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { buildServer } from "../src/server.ts";

const TOKEN = "dev-token-123";

type TestFn = (base: string) => Promise<void>;
const tests: Array<[name: string, fn: TestFn]> = [];
function test(name: string, fn: TestFn) {
  tests.push([name, fn]);
}

test("GET /health is public and returns ok", async (base) => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("GET /api/notes without a token is rejected with 401", async (base) => {
  const res = await fetch(`${base}/api/notes`);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "unauthorized" });
});

test("GET /api/notes with a valid token returns the seed note", async (base) => {
  const res = await fetch(`${base}/api/notes`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { notes: Array<{ title: string }> };
  assert.ok(body.notes.length >= 1);
  assert.equal(body.notes[0].title, "welcome");
});

test("POST /api/notes creates a note and returns 201", async (base) => {
  const res = await fetch(`${base}/api/notes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "from tests", body: "hello" }),
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { note: { id: number; title: string } };
  assert.equal(body.note.title, "from tests");
});

test("responses carry an X-Request-Id header", async (base) => {
  const res = await fetch(`${base}/api/notes`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  assert.ok(res.headers.get("x-request-id"), "expected X-Request-Id header");
});

async function main() {
  const server = buildServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  const base = `http://localhost:${port}`;

  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn(base);
      console.log(`  ok    ${name}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL  ${name}`);
      console.error(`        ${(err as Error).message}`);
    }
  }

  server.close();
  console.log(failed === 0 ? `\nall ${tests.length} tests passed` : `\n${failed}/${tests.length} tests failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
