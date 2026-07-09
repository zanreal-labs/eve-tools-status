"use client";

import { useState } from "react";
import { CircleCheck, Plus, Radar, X } from "lucide-react";

export function SuggestTool() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, url, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: "error", msg: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setState({ kind: "done" });
      setName("");
      setUrl("");
      setNote("");
    } catch {
      setState({ kind: "error", msg: "Network error — try again" });
    }
  }

  if (state.kind === "done") {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-emerald-500/40 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-300">
        <CircleCheck className="h-5 w-5 shrink-0" aria-hidden />
        Thanks! Your suggestion was recorded and will be reviewed.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-sm border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-zinc-900/40 to-zinc-900/40">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-cyan-400/60" />
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <Radar className="mt-0.5 h-6 w-6 shrink-0 text-cyan-400" aria-hidden />
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-zinc-100">
              Missing a tool?
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Know an EVE community tool worth watching? Suggest it and it can
              join the board.
            </p>
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-sm font-medium uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-400/20"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Suggest a tool
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-3 border-t border-zinc-800 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              minLength={2}
              maxLength={100}
              placeholder="Tool name (e.g. Pyfa)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
            <input
              required
              type="url"
              maxLength={300}
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <textarea
            maxLength={500}
            rows={2}
            placeholder="Why should it be monitored? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-sm border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none"
          />
          {state.kind === "error" && (
            <p className="text-xs text-red-400">{state.msg}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={state.kind === "sending"}
              className="rounded-sm border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 text-sm font-medium uppercase tracking-wider text-cyan-300 transition-colors hover:bg-cyan-400/20 disabled:opacity-50"
            >
              {state.kind === "sending" ? "Sending…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
