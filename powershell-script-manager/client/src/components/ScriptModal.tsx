import { useEffect, useId, useRef, useState } from "react";
import type { Script } from "../types";

type ScriptModalProps = {
  script: Script;
  onClose: () => void;
  onSave: (data: { name: string; content: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCopied: () => void;
};

export function ScriptModal({
  script,
  onClose,
  onSave,
  onDelete,
  onCopied,
}: ScriptModalProps) {
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(script.name);
  const [content, setContent] = useState(script.content);
  const [errors, setErrors] = useState<{ name?: string; content?: string; form?: string }>(
    {}
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(script.name);
    setContent(script.content);
    setErrors({});
  }, [script]);

  useEffect(() => {
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [script.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      onClose();
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
        onClose();
      } catch (err) {
        setErrors({
          form: err instanceof Error ? err.message : "Could not delete script.",
        });
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[100dvh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Edit script
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Close"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {errors.form && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {errors.form}
            </p>
          )}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700">
              Script name
            </label>
            <input
              ref={nameInputRef}
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              autoComplete="off"
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <label htmlFor="edit-content" className="block text-sm font-medium text-slate-700">
              Script content
            </label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="mt-1 max-h-[50vh] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 sm:max-h-[min(50vh,28rem)]"
              aria-invalid={errors.content ? "true" : "false"}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.content}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Close
              </button>
            </div>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:opacity-60 sm:ml-auto"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
