# Notes Service

A small internal notes API built on `node:http` with a hand-rolled middleware
pipeline (no frameworks, no dependencies). This is a slice of a larger
enterprise service: the middleware layer is where cross-cutting concerns live —
auth, logging, correlation ids, error shaping.

Your interviewer will give you the tasks during the call. Before then, feel
free to clone this, open it in your editor, and look around.

## Setup

- **Requires only Node.js** (Node ≥ 22.18; Node 24 recommended). It runs
  TypeScript natively — there is **no `npm install` and no build step**.
- On Node 22.x you may see an `ExperimentalWarning: Type Stripping` message —
  that's expected, ignore it.
- If you can't run Node locally, that's fine — the interviewer can run it on
  their machine; you'll work in the code and reason about behavior.

```bash
node src/server.ts          # starts on http://localhost:3000
node test/run-tests.ts      # runs the test suite
```

## The API

| Route | Auth | Description |
|---|---|---|
| `GET /health` | public | liveness check |
| `GET /api/notes` | Bearer token | list notes |
| `POST /api/notes` | Bearer token | create a note `{ "title": "...", "body": "..." }` |

Local dev tokens: `dev-token-123`, `dev-token-456`.

```bash
curl -s http://localhost:3000/api/notes -H "Authorization: Bearer dev-token-123"
```

## Layout

```
src/
  server.ts       wires the middleware chain and starts the server
  pipeline.ts     the middleware engine (App, compose, Ctx, HttpError)
  routes.ts       route table + handlers (in-memory store)
  middleware/     error-handler, auth, request-id, logger
test/
  run-tests.ts    zero-dependency HTTP test harness
  repro.ts        small fetch script used during the session
```

Every error thrown anywhere in the chain is supposed to reach the client as
`{ "error": "<message>", "requestId": "<id>" }` with the right status code —
that's the error-handler middleware's contract.
