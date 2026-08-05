import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ServiceAccount {
  type?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
  token_uri?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "preorder";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: settingsRow } = await adminClient
      .from("site_settings")
      .select("google_enabled, gmail_address, google_sheet_id, google_sheet_tab, google_service_account, email_notifications_enabled, resend_from_email, resend_from_name")
      .eq("id", 1)
      .maybeSingle();

    const settings = settingsRow ?? {};
    const googleEnabled = Boolean(settings.google_enabled);
    const emailEnabled = settings.email_notifications_enabled !== false;

    if (action === "test") {
      const errors: string[] = [];
      if (googleEnabled) {
        const sa = parseSA(settings.google_service_account);
        if (!sa) errors.push("Invalid service account JSON.");
        if (!settings.google_sheet_id) errors.push("Missing Google Sheet ID.");
      }
      if (!settings.gmail_address) errors.push("Missing notification email address.");
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) errors.push("RESEND_API_KEY not configured.");
      if (errors.length > 0) return json({ error: errors.join(" ") }, 400);
      return json({ message: "Configuration is valid. Email provider: Resend." });
    }

    if (action !== "preorder") {
      return json({ error: "Unknown action." }, 400);
    }

    const preorder = body.preorder;
    if (!preorder) return json({ error: "Missing preorder payload." }, 400);

    const errors: string[] = [];

    // 1. Google Sheets (only if Google integration is enabled)
    if (googleEnabled && settings.google_sheet_id) {
      try {
        await appendToSheet(settings, preorder);
      } catch (e) {
        errors.push(`Sheets: ${e.message}`);
      }
    }

    // 2. Email notification (independent of Google integration)
    if (emailEnabled && settings.gmail_address) {
      try {
        await sendNotificationEmail(settings, preorder);
      } catch (e) {
        errors.push(`Email: ${e.message}`);
      }
    }

    if (errors.length > 0) {
      console.error("[google-integration] Errors:", errors.join("; "));
      return json({ message: "Completed with errors.", errors }, 207);
    }
    return json({ message: "Preorder processed successfully." });
  } catch (err) {
    console.error("[google-integration] Fatal:", err);
    return json({ error: err.message ?? "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── Email ── */

async function sendNotificationEmail(settings: Record<string, unknown>, preorder: Record<string, unknown>) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[email] RESEND_API_KEY not set — skipping email");
    return;
  }

  const to = settings.gmail_address as string;
  if (!to) {
    console.error("[email] No recipient address configured");
    return;
  }

  const fromName = (settings.resend_from_name as string) || "be Preorders";
  const fromEmail = (settings.resend_from_email as string) || "noreply@resend.dev";
  const from = `${fromName} <${fromEmail}>`;

  const orderId = String(preorder.id ?? "—").slice(0, 8);
  const date = new Date().toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const deliveryLabel = preorder.delivery_method === "office_pickup" ? "Office Pickup" : "Home Delivery";
  const price = Number(preorder.price ?? 0);
  const quantity = Number(preorder.quantity ?? 1);
  const total = price * quantity;
  const currency = String(preorder.currency ?? "DZD");

  const subject = `New Preorder #${orderId} — ${preorder.full_name ?? "Unknown"}`;

  const html = buildEmailTemplate({
    orderId,
    date,
    collectionName: String(preorder.collection_name ?? "—"),
    price: formatPrice(price, currency),
    quantity: String(quantity),
    total: formatPrice(total, currency),
    fullName: String(preorder.full_name ?? "—"),
    phone: String(preorder.phone ?? "—"),
    email: String(preorder.email ?? "—"),
    wilaya: String(preorder.wilaya ?? "—"),
    municipality: preorder.municipality ? String(preorder.municipality) : "",
    deliveryLabel,
    size: String(preorder.size ?? "—"),
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t.slice(0, 300)}`);
  }
}

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString("en-US")} ${currency}`;
}

function buildEmailTemplate(d: {
  orderId: string;
  date: string;
  collectionName: string;
  price: string;
  quantity: string;
  total: string;
  fullName: string;
  phone: string;
  email: string;
  wilaya: string;
  municipality: string;
  deliveryLabel: string;
  size: string;
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede5;color:#9a9a9a;font-size:13px;width:40%;font-family:'Inter',sans-serif;">
        ${label}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede5;color:#1c1c1c;font-size:13px;font-family:'Inter',sans-serif;">
        ${value}
      </td>
    </tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f5ef;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ef;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,28,46,0.04),0 18px 48px -24px rgba(15,28,46,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:#0f1c2e;padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#f8f5ef;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:300;letter-spacing:0.02em;">be</h1>
            <p style="margin:8px 0 0;color:#d9c5a1;font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;">New Preorder Received</p>
          </td>
        </tr>

        <!-- Order ID badge -->
        <tr>
          <td style="padding:28px 40px 0;">
            <div style="display:inline-block;background:#0f1c2e08;border:1px solid #0f1c2e15;border-radius:8px;padding:6px 16px;">
              <span style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#0f1c2e;font-weight:500;">Order #${d.orderId}</span>
            </div>
          </td>
        </tr>

        <!-- Date -->
        <tr>
          <td style="padding:12px 40px 0;">
            <p style="margin:0;color:#9a9a9a;font-family:'Inter',sans-serif;font-size:12px;">${d.date}</p>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:24px 40px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${row("Collection", d.collectionName)}
              ${row("Price", d.price)}
              ${row("Quantity", d.quantity)}
              ${row("Total", `<strong style="color:#0f1c2e;">${d.total}</strong>`)}
              ${row("Size", d.size)}
              ${row("Delivery Method", d.deliveryLabel)}
              ${row("Wilaya", d.wilaya)}
              ${d.municipality ? row("Municipality", d.municipality) : ""}
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:8px 40px;"><div style="height:1px;background:#e8e3d8;margin:8px 0;"></div></td></tr>

        <!-- Customer info -->
        <tr>
          <td style="padding:8px 40px 8px;">
            <p style="margin:0 0 12px;color:#9a9a9a;font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;">Customer</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${row("Name", d.fullName)}
              ${row("Phone", d.phone)}
              ${row("Email", d.email)}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f5ef;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#6b6b6b;font-family:'Inter',sans-serif;font-size:11px;">
              This is an automated notification from your be store.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Google Sheets ── */

function parseSA(raw: unknown): ServiceAccount | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (typeof raw === "object") return raw as ServiceAccount;
  return null;
}

async function appendToSheet(settings: Record<string, unknown>, preorder: Record<string, unknown>) {
  const sa = parseSA(settings.google_service_account);
  if (!sa || !sa.private_key || !sa.client_email) throw new Error("Invalid service account.");
  const sheetId = settings.google_sheet_id as string;
  const tab = (settings.google_sheet_tab as string) || "Preorders";

  const token = await getAccessToken(sa, ["https://www.googleapis.com/auth/spreadsheets"]);

  const values = [[
    new Date().toISOString(),
    preorder.full_name ?? "",
    preorder.email ?? "",
    preorder.phone ?? "",
    preorder.delivery_method ?? "",
    preorder.wilaya ?? "",
    preorder.municipality ?? "",
    preorder.size ?? "",
    preorder.quantity ?? 1,
    preorder.collection_name ?? "",
    preorder.status ?? "received",
  ]];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Sheets API ${res.status}: ${t.slice(0, 200)}`);
  }
}

async function getAccessToken(sa: ServiceAccount, scopes: string[]): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: scopes.join(" "),
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const enc = (o: unknown) => base64url(JSON.stringify(o));
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = await rsaSign(sa.private_key!, signingInput);
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function rsaSign(privateKeyPem: string, data: string): Promise<string> {
  const pem = privateKeyPem.replace(/\\n/g, "\n");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return base64urlBytes(new Uint8Array(sig));
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function base64url(s: string): string {
  return base64urlBytes(new TextEncoder().encode(s));
}
function base64urlBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ── Inline Supabase REST client ── */

function createClient(url: string, key: string) {
  return {
    from(table: string) {
      const base = `${url}/rest/v1/${table}`;
      let query = "";
      let filters: string[] = [];
      let single = false;
      let maybeSingle = false;
      let orderCol = "";
      let orderAsc = true;
      const headers: Record<string, string> = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };
      const chain = {
        select(cols: string) { query = `select=${encodeURIComponent(cols)}`; return chain; },
        eq(col: string, val: unknown) { filters.push(`${col}=eq.${encodeURIComponent(String(val))}`); return chain; },
        order(col: string, opts: { ascending?: boolean }) { orderCol = col; orderAsc = opts.ascending ?? true; return chain; },
        single() { single = true; return chain; },
        maybeSingle() { maybeSingle = true; return chain; },
        async then(resolve: (v: { data: unknown; error: unknown }) => void) {
          let url2 = `${base}?${query}`;
          for (const f of filters) url2 += `&${f}`;
          if (orderCol) url2 += `&order=${orderCol}.${orderAsc ? "asc" : "desc"}`;
          const res = await fetch(url2, { headers });
          const data = await res.json();
          resolve({ data: maybeSingle ? (Array.isArray(data) ? data[0] ?? null : data) : data, error: null });
        },
      };
      return chain;
    },
  };
}
