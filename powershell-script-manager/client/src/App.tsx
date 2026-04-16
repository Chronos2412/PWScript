import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as backupApi from "./api/backup";
import * as api from "./api/scripts";
import { NewScriptForm } from "./components/NewScriptForm";
import { ScriptModal } from "./components/ScriptModal";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toast } from "./components/Toast";
import { useTheme } from "./hooks/useTheme";
import { scriptPreview } from "./lib/preview";
import type { Script } from "./types";

const searchInputClass =
  "w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-sky-500/80 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400/80 dark:focus:ring-sky-400/20";

const btnSecondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200 dark:shadow-soft-dark dark:hover:border-slate-500 dark:hover:bg-slate-700/80 dark:hover:text-white dark:focus-visible:ring-offset-slate-950";

function IconPlus(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconSearch(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

export function App() {
  const { dark, toggle } = useTheme();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Script | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api.getScripts();
      setScripts(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load scripts.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.getScripts();
        if (!cancelled) setScripts(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load scripts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => s.name.toLowerCase().includes(q));
  }, [scripts, search]);

  async function handleCreate(body: { name: string; content: string }) {
    await api.createScript(body);
    await refresh();
    setShowNew(false);
  }

  async function handleSaveModal(body: { name: string; content: string }) {
    if (!selected) return;
    await api.updateScript(selected.id, body);
    await refresh();
    setToast("Script saved successfully");
  }

  async function handleDelete(id: number) {
    await api.deleteScript(id);
    await refresh();
    setToast("Script deleted");
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    try {
      await backupApi.downloadBackup();
      setToast("Backup downloaded");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBackupBusy(false);
    }
  }

  function handleImportPick() {
    importInputRef.current?.click();
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBackupBusy(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        setToast("That file is not valid JSON.");
        return;
      }
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { scripts?: unknown }).scripts)) {
        setToast("Invalid backup: expected a JSON object with a \"scripts\" array.");
        return;
      }
      const payload = parsed as backupApi.BackupPayload;
      const incoming = payload.scripts.length;
      const current = scripts.length;
      const ok = window.confirm(
        incoming === 0
          ? `This will delete all ${current} script(s) on this computer. The backup file contains no scripts. Continue?`
          : `This will replace all ${current} script(s) here with ${incoming} script(s) from the file. Continue?`
      );
      if (!ok) return;

      const result = await backupApi.importBackup(payload);
      await refresh();
      setToast(`Imported ${result.imported} script(s)`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBackupBusy(false);
    }
  }

  function openModal(script: Script) {
    setSelected(script);
  }

  function closeModal() {
    setSelected(null);
  }

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-soft backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 dark:shadow-soft-dark">
        <nav className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8" aria-label="Main">
          <div className="flex flex-col gap-6 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                <div
                  className="hidden h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-3.5 text-white shadow-soft-lg ring-1 ring-white/10 dark:from-sky-400 dark:to-indigo-600 sm:flex sm:items-center sm:justify-center"
                  aria-hidden
                >
                  <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600/95 dark:text-sky-400/90">
                    Script vault
                  </p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    PowerShell Script Vault
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Store, edit and copy PowerShell scripts easily.
                  </p>
                </div>
              </div>
              <ThemeToggle dark={dark} onToggle={toggle} />
            </div>

            <div>
              <label htmlFor="search-scripts" className="sr-only">
                Search scripts by name
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden
                >
                  <IconSearch className="h-5 w-5" />
                </span>
                <input
                  id="search-scripts"
                  type="search"
                  placeholder="Search scripts by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={searchInputClass}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-expanded={showNew}
                className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-btn-primary ring-1 ring-white/10 transition hover:brightness-110 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:shadow-btn-primary-dark dark:focus-visible:ring-offset-slate-950 sm:w-auto sm:min-w-[200px]"
              >
                <IconPlus className="h-5 w-5 transition group-hover:scale-110" />
                {showNew ? "Hide new script" : "New script"}
              </button>
              <div className="flex flex-wrap gap-2 sm:ml-0 sm:items-center">
                <button
                  type="button"
                  onClick={() => void handleExportBackup()}
                  disabled={backupBusy}
                  className={btnSecondary}
                >
                  Export backup
                </button>
                <button type="button" onClick={handleImportPick} disabled={backupBusy} className={btnSecondary}>
                  Import backup
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Choose backup JSON file"
                  onChange={(e) => void handleImportFileChange(e)}
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              Export downloads a JSON backup you can move to another computer. Import replaces all scripts here after
              confirmation.
            </p>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {showNew && (
          <div className="mb-10">
            <NewScriptForm
              onCancel={() => setShowNew(false)}
              onSaved={() => setToast("Script saved successfully")}
              onCreate={handleCreate}
            />
          </div>
        )}

        <section aria-labelledby="scripts-heading">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="scripts-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                Library
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Alphabetical by name</p>
            </div>
            <p className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
              {loading
                ? "Loading…"
                : `${filtered.length} ${filtered.length === 1 ? "script" : "scripts"} shown`}
            </p>
          </div>

          {loadError && (
            <div
              className="mb-6 rounded-2xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              {loadError}
              <button
                type="button"
                className="ml-2 font-medium underline underline-offset-2 hover:text-red-950 dark:hover:text-white"
                onClick={() => {
                  setLoading(true);
                  void refresh().finally(() => setLoading(false));
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && filtered.length === 0 && !loadError && (
            <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/70 p-12 text-center shadow-sm dark:border-slate-600/80 dark:bg-slate-900/50 dark:shadow-none">
              {scripts.length === 0 ? (
                <>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No scripts yet</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Use <span className="font-medium text-slate-800 dark:text-slate-200">New script</span> in the header
                    to add your first one.
                  </p>
                </>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No scripts match your search.</p>
              )}
            </div>
          )}

          <ul className="grid gap-4 sm:grid-cols-1">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openModal(s)}
                  className="group w-full rounded-2xl border border-slate-200/80 bg-white/95 p-5 text-left shadow-soft ring-1 ring-slate-900/[0.04] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-sky-200/80 hover:shadow-soft-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 active:translate-y-0 dark:border-slate-700/80 dark:bg-slate-900/60 dark:ring-white/[0.06] dark:hover:border-sky-500/35 dark:hover:shadow-soft-dark"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-base font-semibold text-slate-900 transition-colors group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
                      {s.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Updated {new Date(s.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-400 sm:text-sm">
                    {scriptPreview(s.content)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {selected && (
        <ScriptModal
          script={selected}
          onClose={closeModal}
          onSave={handleSaveModal}
          onDelete={handleDelete}
          onCopied={() => setToast("Copied to clipboard")}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
