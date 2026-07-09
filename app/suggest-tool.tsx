"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";

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
      <div className="flex items-center gap-4 rounded-[48px] bg-zinc-900/60 px-6 py-6 md:rounded-full md:px-12 md:py-8">
        <CircleCheck className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
        <p className="text-xl font-medium text-zinc-100 md:text-2xl">
          Thanks — your suggestion is in the queue.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col items-start justify-between gap-8 rounded-[48px] bg-zinc-900/60 px-6 py-6 md:flex-row md:items-center md:rounded-full md:py-8 md:pl-12 md:pr-8">
        <p className="text-xl font-medium text-zinc-100 md:text-2xl">
          Know an EVE tool we should watch?
        </p>
        <div className="max-w-full shrink-0 rounded-full outline-1 outline-zinc-700 outline-offset-8">
          <button
            onClick={() => setOpen(true)}
            className="group flex h-auto max-w-full items-center justify-between gap-3 whitespace-normal rounded-full bg-zinc-100 py-1.5 pl-6 pr-1.5 text-left text-lg font-medium text-zinc-950 transition-colors hover:bg-white md:text-xl"
          >
            Suggest a tool
            <span className="shrink-0 rounded-full bg-zinc-950 p-1.5">
              <ArrowRight
                className="size-5 -rotate-45 text-zinc-100 transition-transform group-hover:rotate-0 md:size-6"
                aria-hidden
              />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[48px] bg-zinc-900/60 px-6 py-8 md:px-12">
      <p className="mb-6 text-xl font-medium text-zinc-100 md:text-2xl">
        Know an EVE tool we should watch?
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            minLength={2}
            maxLength={100}
            placeholder="Tool name (e.g. Pyfa)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
          />
          <input
            required
            type="url"
            maxLength={300}
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-full border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
          />
        </div>
        <textarea
          maxLength={500}
          rows={2}
          placeholder="Why should it be monitored? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-3xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
        />
        {state.kind === "error" && (
          <p className="px-2 text-xs text-red-400">{state.msg}</p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={state.kind === "sending"}
            className="group flex items-center gap-3 rounded-full bg-zinc-100 py-1.5 pl-6 pr-1.5 text-lg font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {state.kind === "sending" ? "Sending…" : "Submit"}
            <span className="shrink-0 rounded-full bg-zinc-950 p-1.5">
              <ArrowRight
                className="size-5 -rotate-45 text-zinc-100 transition-transform group-hover:rotate-0"
                aria-hidden
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-5 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
