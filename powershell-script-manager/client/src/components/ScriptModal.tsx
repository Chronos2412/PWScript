import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Script } from "../types";

type ScriptModalProps = {
  script: Script;
  onClose: () => void;
  onSave: (data: { name: string; content: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCopied: () => void;
};

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500/80 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/80 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-sky-400/80 dark:focus:ring-sky-400/20";

const DURATION_MS = 220;

export function ScriptModal({
  script,
  onClose,
  onSave,
  onDelete,
  onCopied,
}: ScriptModalProps) {
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState(script.name);
  const [content, setContent] = useState(script.content);
  const [errors, setErrors] = useState<{ name?: string; content?: string; form?: string }>(
    {}
  );
  const [busy, setBusy] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setName(script.name);
    setContent(script.content);
    setErrors({});
  }, [script]);

  useEffect(() => {
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [script.id]);

  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  function validate(): boolean {
    const next: { name?: string; content?: string } = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!content.trim()) next.content = "Script content is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setErrors({});
    try {
      await onSave({ name: name.trim(), content });
      requestClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Could not save changes.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      onCopied();
    } catch {
      setErrors({ form: "Clipboard access was denied. Copy the text manually." });
    }
  }

  function handleDeleteClick() {
    const ok = window.confirm(
      `Delete script "${script.name}"? This cannot be undone.`
    );
    if (!ok) return;
    void (async () => {
      setBusy(true);
      try {
        await onDelete(script.id);
        requestClose();
      } catch (err) {
        setErrors({
          form: err instanceof Error ? err.message : "Could not delete script.",
        });
      } finally {
        setBusy(false);
      }
    })();
  }

  const show = entered && !closing;
  const overlayClass = `absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ease-out dark:bg-slate-950/75 ${
    show ? "opacity-100" : "opacity-0"
  }`;
  const panelClass = `relative z-10 flex max-h-[100dvh] w-full max-w-3xl flex-col rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/[0.05] transition-all duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-slate-950/60 dark:ring-white/[0.06] sm:max-h-[90vh] sm:rounded-3xl ${
    show ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className={overlayClass}
        onClick={() => !busy && requestClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700/80 sm:px-7 sm:py-5">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Edit script
          </h2>
          <button
            type="button"
            onClick={() => !busy && requestClose()}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <span aria-hidden className="text-lg leading-none">
              ✕
            </span>
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
        >
          {errors.form && (
            <p
              className="rounded-xl border border-red-200/90 bg-red-50/95 px-3.5 py-2.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              {errors.form}
            </p>
          )}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Script name
            </label>
            <input
              ref={nameInputRef}
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              autoComplete="off"
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <label htmlFor="edit-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Script content
            </label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className={`${field} max-h-[50vh] resize-y font-mono text-[13px] leading-relaxed sm:max-h-[min(50vh,28rem)]`}
              aria-invalid={errors.content ? "true" : "false"}
            />
            {errors.content && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.content}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-sky-400 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:focus-visible:ring-offset-slate-950"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => !busy && requestClose()}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:focus-visible:ring-offset-slate-950"
              >
                Close
              </button>
            </div>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-200 dark:hover:bg-red-950/55 dark:focus-visible:ring-offset-slate-950 sm:ml-auto"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
