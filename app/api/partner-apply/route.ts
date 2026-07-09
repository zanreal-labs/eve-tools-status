import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { kv, K } from "@/lib/kv";
import { getSesClient, sesConfigured, SES_FROM } from "@/lib/ses";

export const dynamic = "force-dynamic";

const MAX_PER_HOUR = 3;
const CONTACT_EMAIL =
  process.env.PARTNER_CONTACT_EMAIL ?? "m.janota@zanreal.com";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const project = String(body.project ?? "").trim();
  const url = String(body.url ?? "").trim();
  const healthUrl = String(body.healthUrl ?? "").trim();
  const email = String(body.email ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const message = String(body.message ?? "").trim();
  const website = String(body.website ?? "").trim(); // honeypot

  if (project.length < 2 || project.length > 100) {
    return NextResponse.json(
      { error: "Project name is required (2–100 chars)" },
      { status: 400 },
    );
  }
  if (!isUrl(url) || url.length > 300) {
    return NextResponse.json(
      { error: "A valid project URL is required" },
      { status: 400 },
    );
  }
  if (healthUrl && (!isUrl(healthUrl) || healthUrl.length > 300)) {
    return NextResponse.json(
      { error: "Health endpoint must be a valid http(s) URL" },
      { status: 400 },
    );
  }
  if (!isEmail(email) || email.length > 160) {
    return NextResponse.json(
      { error: "A valid contact e-mail is required" },
      { status: 400 },
    );
  }
  if (contact.length > 160 || message.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }
  // Honeypot tripped — pretend success.
  if (website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 12);
  const r = kv();

  const rlKey = K.rateLimit(`partner:${ipHash}`);
  const count = await r.incr(rlKey);
  if (count === 1) await r.expire(rlKey, 3600);
  if (count > MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many applications — try again later" },
      { status: 429 },
    );
  }

  const application = {
    ts: Date.now(),
    project,
    url,
    healthUrl,
    email,
    contact,
    message,
  };

  // Always keep a copy in KV, even when e-mail delivery is down.
  await r.lpush("ets:partners", JSON.stringify(application));
  await r.ltrim("ets:partners", 0, 499);

  if (sesConfigured()) {
    try {
      const html = `
        <h2>Partner application — EVE Tools Status</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><b>Project</b></td><td>${esc(project)}</td></tr>
          <tr><td><b>URL</b></td><td>${esc(url)}</td></tr>
          <tr><td><b>Health endpoint</b></td><td>${esc(healthUrl || "—")}</td></tr>
          <tr><td><b>E-mail</b></td><td>${esc(email)}</td></tr>
          <tr><td><b>EVE char / Discord</b></td><td>${esc(contact || "—")}</td></tr>
        </table>
        <p style="white-space:pre-wrap">${esc(message || "(no message)")}</p>`;
      await getSesClient().send(
        new SendEmailCommand({
          FromEmailAddress: SES_FROM,
          Destination: { ToAddresses: [CONTACT_EMAIL] },
          ReplyToAddresses: isEmail(email) ? [email] : undefined,
          Content: {
            Simple: {
              Subject: {
                Data: `[eve-tools-status] Partner application: ${project}`,
              },
              Body: {
                Html: { Data: html },
                Text: {
                  Data: `Partner application\n\nProject: ${project}\nURL: ${url}\nHealth: ${healthUrl || "-"}\nE-mail: ${email}\nContact: ${contact || "-"}\n\n${message}`,
                },
              },
            },
          },
        }),
      );
    } catch (err) {
      // Application is already stored in KV; log and continue.
      console.error("partner-apply: SES send failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
