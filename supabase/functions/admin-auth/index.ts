import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "login";
    const body = await req.json().catch(() => ({}));

    if (action === "login") return handleLogin(body);
    if (action === "verify") return handleVerify(body);
    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});

async function handleLogin(body: { password?: string }): Promise<Response> {
  const password = body.password;
  if (typeof password !== "string" || password.length === 0) {
    return json({ error: "Password is required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server not configured." }, 500);
  }

  // Verify the password server-side via the locked-down SQL function.
  const verifyRes = await fetch(
    `${supabaseUrl}/rest/v1/rpc/admin_verify_password`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: password }),
    },
  );
  if (!verifyRes.ok) {
    return json({ error: "Authentication failed." }, 401);
  }
  const ok = (await verifyRes.json()) as boolean;
  if (!ok) {
    // Constant-ish failure; do not reveal whether the row exists.
    return json({ error: "Incorrect password." }, 401);
  }

  // Fetch the token secret (service role bypasses RLS).
  const secretRes = await fetch(
    `${supabaseUrl}/rest/v1/admin_auth?select=token_secret&id=eq.1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  if (!secretRes.ok) {
    return json({ error: "Authentication failed." }, 500);
  }
  const rows = (await secretRes.json()) as { token_secret: string }[];
  const secret = rows[0]?.token_secret;
  if (!secret) {
    return json({ error: "Authentication failed." }, 500);
  }

  const token = await issueToken(secret);
  return json({ token });
}

async function handleVerify(body: { token?: string }): Promise<Response> {
  const token = body.token;
  if (typeof token !== "string" || token.length === 0) {
    return json({ valid: false }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return json({ valid: false }, 500);
  }

  const secretRes = await fetch(
    `${supabaseUrl}/rest/v1/admin_auth?select=token_secret&id=eq.1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  if (!secretRes.ok) return json({ valid: false }, 500);
  const rows = (await secretRes.json()) as { token_secret: string }[];
  const secret = rows[0]?.token_secret;
  if (!secret) return json({ valid: false }, 500);

  const valid = await verifyToken(secret, token);
  return json({ valid }, valid ? 200 : 401);
}

// HMAC-SHA256 signed token: base64url(payload).base64url(sig)
// payload = { exp: number } (ms since epoch)
async function issueToken(secret: string): Promise<string> {
  const payload = { exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = base64url(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  return `${payloadB64}.${base64urlBytes(sig)}`;
}

async function verifyToken(secret: string, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  let payload: { exp?: number };
  try {
    payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;

  const key = await hmacKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  const got = b64urlToBytes(sigB64);
  return constantTimeEqual(expected, got);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function base64url(s: string): string {
  return base64urlBytes(new TextEncoder().encode(s));
}
function base64urlBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
