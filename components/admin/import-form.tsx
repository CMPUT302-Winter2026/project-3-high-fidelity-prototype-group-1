"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { IMPORT_CSV_COLUMNS, IMPORT_ITWEWINA_EXAMPLE, IMPORT_JSON_EXAMPLE } from "@/lib/constants";

export function ImportForm() {
  const [mode, setMode] = useState<"json" | "csv" | "itwewina">("json");
  const [text, setText] = useState(IMPORT_JSON_EXAMPLE);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isItwewinaMode = mode === "itwewina";

  return (
    <div className="space-y-4">
      <section className="surface-card p-5">
        <p className="section-label">Import mode</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["json", "csv", "itwewina"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setError("");
                setMessage("");
                setText(
                  option === "json" ? IMPORT_JSON_EXAMPLE : option === "itwewina" ? IMPORT_ITWEWINA_EXAMPLE : ""
                );
              }}
              className={mode === option ? "tap-button-primary" : "tap-button-secondary"}
            >
              {option === "itwewina" ? "ITWEWINA" : option.toUpperCase()}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="section-label">{isItwewinaMode ? "Search terms" : "Paste or load data"}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="app-input mt-2 min-h-72 font-mono text-xs leading-6"
          />
        </label>

        {isItwewinaMode ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add one Cree or English search term per line. The server will fetch
            <code> https://itwewina.altlab.app/search?q=...</code>, parse the live search results, and import the
            returned entries into this app.
          </p>
        ) : null}

        <label className="tap-button-secondary mt-3 inline-flex cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          Load file
          <input
            type="file"
            className="hidden"
            accept={
              mode === "json"
                ? ".json,application/json"
                : mode === "csv"
                  ? ".csv,text/csv"
                  : ".txt,text/plain"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              file.text().then((value) => setText(value));
            }}
          />
        </label>

        {message ? <p className="mt-3 text-sm text-moss-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          className="tap-button-primary mt-4"
          disabled={isPending}
          onClick={() => {
            setError("");
            setMessage("");

            startTransition(async () => {
              const response = await fetch("/api/admin/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode, text })
              });

              const payload = (await response.json().catch(() => null)) as
                | { importedCount?: number; queryCount?: number; error?: string }
                | null;

              if (!response.ok) {
                setError(payload?.error ?? "Import failed.");
                return;
              }

              const importedCount = payload?.importedCount ?? 0;
              const queryCount = payload?.queryCount;
              setMessage(
                queryCount
                  ? `Imported ${importedCount} entries from ${queryCount} itwewina search term(s).`
                  : `Imported ${importedCount} entries.`
              );
              router.refresh();
            });
          }}
        >
          {isPending ? "Importing..." : "Run import"}
        </button>
      </section>

      <section className="surface-card p-5">
        <p className="section-label">CSV expectations</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nested fields such as <code>meanings</code>, <code>morphologyTables</code>, and <code>relations</code> can
          be JSON arrays inside CSV cells. Categories can be provided with <code>categorySlugs</code> as a pipe-separated
          list or JSON array.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {IMPORT_CSV_COLUMNS.map((column) => (
            <span key={column} className="chip">
              {column}
            </span>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <p className="section-label">Itwewina import notes</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Imported itwewina entries keep the Cree lemma, syllabics, first gloss, linguistic breakdown, stem, and a best
          available audio link when the speech database has one. Review imported notes and explanations afterward,
          because the source search page does not expose every field in your local schema.
        </p>
      </section>
    </div>
  );
}
