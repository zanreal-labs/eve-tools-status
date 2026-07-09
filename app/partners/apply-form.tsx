"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";

const inputCls =
  "w-full rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none";

export function ApplyForm() {
  const [form, setForm] = useState({
    project: "",
    url: "",
    healthUrl: "",
    email: "",
    contact: "",
    message: "",
    website: "", // honeypot
  });
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/partner-apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: "error", msg: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error", msg: "Network error — try again" });
    }
  }

  if (state.kind === "done") {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-emerald-500/40 bg-emerald-500/5 px-5 py-5 text-sm text-emerald-300">
        <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
        Application received — we&apos;ll get back to you at the e-mail you
        provided. o7
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          minLength={2}
          maxLength={100}
          placeholder="Project name *"
          value={form.project}
          onChange={set("project")}
          className={inputCls}
        />
        <input
          required
          type="url"
          maxLength={300}
          placeholder="Project URL * (https://…)"
          value={form.url}
          onChange={set("url")}
          className={inputCls}
        />
        <input
          type="url"
          maxLength={300}
          placeholder="Health endpoint URL (optional)"
          value={form.healthUrl}
          onChange={set("healthUrl")}
          className={inputCls}
        />
        <input
          required
          type="email"
          maxLength={160}
          placeholder="Contact e-mail *"
          value={form.email}
          onChange={set("email")}
          className={inputCls}
        />
      </div>
      <input
        maxLength={160}
        placeholder="EVE character / Discord (optional)"
        value={form.contact}
        onChange={set("contact")}
        className={inputCls}
      />
      <textarea
        maxLength={2000}
        rows={4}
        placeholder="Tell us about the project — what it does, expected traffic on the health endpoint, anything special about checking it (optional)"
        value={form.message}
        onChange={set("message")}
        className={inputCls}
      />
      {/* honeypot */}
      <input
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={set("website")}
        className="hidden"
        aria-hidden
        name="website"
      />
      {state.kind === "error" && (
        <p className="text-xs text-red-400">{state.msg}</p>
      )}
      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="group flex items-center gap-3 rounded-full bg-zinc-100 py-1.5 pl-6 pr-1.5 text-lg font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
      >
        {state.kind === "sending" ? "Sending…" : "Apply for partnership"}
        <span className="shrink-0 rounded-full bg-zinc-950 p-1.5">
          <ArrowRight
            className="size-5 -rotate-45 text-zinc-100 transition-transform group-hover:rotate-0"
            aria-hidden
          />
        </span>
      </button>
    </form>
  );
}
