import { useState } from "react";

type NewScriptFormProps = {
  onCancel: () => void;
  onSaved: () => void;
  onCreate: (data: { name: string; content: string }) => Promise<void>;
};

const field =
  "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500/80 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400/80 dark:focus:ring-sky-400/20";

export function NewScriptForm({ onCancel, onSaved, onCreate }: NewScriptFormProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: { name?: string; content?: string } = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!content.trim()) next.content = "Script content is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onCreate({ name: name.trim(), content });
      setName("");
      setContent("");
      setErrors({});
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save script.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="new-script-heading"
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-soft ring-1 ring-slate-900/[0.04] dark:border-slate-700/80 dark:bg-slate-900/50 dark:shadow-soft-dark dark:ring-white/[0.06] sm:p-7"
    >
      <h2 id="new-script-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
        New script
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Add a name and paste your PowerShell. Names must be unique.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {formError && (
          <p
            className="rounded-xl border border-red-200/90 bg-red-50/95 px-3.5 py-2.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
            role="alert"
          >
            {formError}
          </p>
        )}
        <div>
          <label htmlFor="new-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Name
          </label>
          <input
            id="new-name"
            name="name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            placeholder="e.g. Export-UserReport"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "new-name-error" : undefined}
          />
          {errors.name && (
            <p id="new-name-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="new-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Script content
          </label>
          <textarea
            id="new-content"
            name="content"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${field} resize-y font-mono text-[13px] leading-relaxed`}
            placeholder="# Your script..."
            aria-invalid={errors.content ? "true" : "false"}
            aria-describedby={errors.content ? "new-content-error" : undefined}
          />
          {errors.content && (
            <p id="new-content-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.content}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-500 hover:to-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:focus-visible:ring-offset-slate-950"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
