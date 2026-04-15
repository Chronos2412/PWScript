import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as backupApi from "./api/backup";
import * as api from "./api/scripts";
import { NewScriptForm } from "./components/NewScriptForm";
import { ScriptModal } from "./components/ScriptModal";
import { Toast } from "./components/Toast";
import { scriptPreview } from "./lib/preview";
import type { Script } from "./types";

export function App() {
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
    const id = window.setTimeout(() => setToast(null), 2800);
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
  }

  async function handleDelete(id: number) {
    await api.deleteScript(id);
    await refresh();
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
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              PowerShell Script Manager
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Store, search, and edit scripts locally. Runs anywhere Node.js runs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleExportBackup()}
                disabled={backupBusy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export backup
              </button>
              <button
                type="button"
                onClick={handleImportPick}
                disabled={backupBusy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
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
            <p className="mt-2 max-w-xl text-xs text-slate-500">
              Export downloads a JSON file you can copy to another machine. Import replaces every script
              here with the file contents (you will be asked to confirm).
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[16rem]">
            <label htmlFor="search-scripts" className="sr-only">
              Search scripts by name
            </label>
            <input
              id="search-scripts"
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-expanded={showNew}
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              {showNew ? "Hide new script" : "New script"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {showNew && (
          <div className="mb-8">
            <NewScriptForm
              onCancel={() => setShowNew(false)}
              onSaved={() => setToast("Script saved")}
              onCreate={handleCreate}
            />
          </div>
        )}

        <section aria-labelledby="scripts-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="scripts-heading" className="text-lg font-semibold text-slate-900">
              Your scripts
            </h2>
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading…"
                : `${filtered.length} ${filtered.length === 1 ? "script" : "scripts"} shown`}
            </p>
          </div>

          {loadError && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {loadError}
              <button
                type="button"
                className="ml-2 underline"
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
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              {scripts.length === 0 ? (
                <>
                  <p className="font-medium text-slate-800">No scripts yet</p>
                  <p className="mt-2 text-sm">
                    Use <span className="font-medium">New script</span> above to add your first
                    one.
                  </p>
                </>
              ) : (
                <p>No scripts match your search.</p>
              )}
            </div>
          )}

          <ul className="grid gap-3 sm:grid-cols-1">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openModal(s)}
                  className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-base font-semibold text-slate-900 group-hover:text-sky-800">
                      {s.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      Updated {new Date(s.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-slate-600 line-clamp-2 sm:text-sm">
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
