// Cross-platform repro for BUG-4312 (no curl needed): node test/repro.ts
// Expects the server to be running on localhost:3000.
try {
  const res = await fetch("http://localhost:3000/api/notes", {
    method: "POST",
    headers: { Authorization: "Bearer dev-token-123" },
    body: "not json",
  });
  console.log("status:", res.status);
  console.log("body:", await res.text());
} catch (err) {
  console.error("request failed:", (err as Error & { cause?: unknown }).cause ?? err);
  process.exit(1);
}
