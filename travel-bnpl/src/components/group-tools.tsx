"use client";

import { useState, useSyncExternalStore } from "react";
import type { ChatMessage } from "@/server/members";

type ChatProps = {
  departureId: string;
  you: string;
  seed: ChatMessage[];
  labels: { heading: string; placeholder: string; send: string; note: string };
};

/**
 * Tiny localStorage store usable with useSyncExternalStore: the server
 * snapshot is the fallback, the client snapshot is the stored JSON string
 * (strings compare by value, so no new object per render).
 */
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. */
  }
  listeners.forEach((cb) => cb());
}
function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  let value = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      /* keep fallback */
    }
  }
  return [value, (v: T) => write(key, v)];
}

export function GroupChat({ departureId, you, seed, labels }: ChatProps) {
  const key = `chat:${departureId}`;
  const [mine, setMine] = useStored<ChatMessage[]>(key, []);
  const [text, setText] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const now = new Date();
    const msg: ChatMessage = {
      id: `${departureId}-${now.getTime()}`,
      author: you,
      body,
      at: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
    setMine([...mine, msg]);
    setText("");
  }

  const all = [...seed, ...mine];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{labels.heading}</h2>
      <ol className="flex flex-col gap-2">
        {all.map((msg) => {
          const own = msg.author === you;
          return (
            <li key={msg.id} className={"flex flex-col " + (own ? "items-end" : "items-start")}>
              {!own && (
                <span className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{msg.author}</span>
              )}
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm " +
                  (own
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800")
                }
              >
                {msg.body}
              </div>
              <span className="px-1 text-[10px] text-zinc-400">{msg.at}</span>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="flex gap-2">
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          {labels.send}
        </button>
      </form>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.note}</p>
    </section>
  );
}

type ChecklistProps = {
  departureId: string;
  items: { key: string; label: string }[];
  labels: { heading: string; note: string };
};

export function Checklist({ departureId, items, labels }: ChecklistProps) {
  const key = `checklist:${departureId}`;
  const [done, setDone] = useStored<Record<string, boolean>>(key, {});

  function toggle(k: string) {
    setDone({ ...done, [k]: !done[k] });
  }

  const count = items.filter((i) => done[i.key]).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{labels.heading}</h2>
        <span className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
          {count}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
              <input
                id={`check-${i.key}`}
                type="checkbox"
                checked={!!done[i.key]}
                onChange={() => toggle(i.key)}
                className="size-5 accent-zinc-900 dark:accent-zinc-50"
              />
              <span className={done[i.key] ? "text-zinc-400 line-through" : ""}>{i.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.note}</p>
    </section>
  );
}
