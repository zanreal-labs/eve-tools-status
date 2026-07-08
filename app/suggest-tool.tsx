"use client";

import { useState } from "react";

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
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
        Thanks! Your suggestion was recorded and will be reviewed.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-zinc-700 px-5 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
      >
        Missing a tool? Suggest one →
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-5"
    >
      <div className="text-sm font-medium">Suggest a tool to monitor</div>
      <input
        required
        minLength={2}
        maxLength={100}
        placeholder="Tool name (e.g. Pyfa)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
      />
      <input
        required
        type="url"
        maxLength={300}
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
      />
      <textarea
        maxLength={500}
        rows={2}
        placeholder="Why should it be monitored? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
      />
      {state.kind === "error" && (
        <p className="text-xs text-red-400">{state.msg}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state.kind === "sending" ? "Sending…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
