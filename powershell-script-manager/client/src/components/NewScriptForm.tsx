import { useState } from "react";

type NewScriptFormProps = {
  onCancel: () => void;
  onSaved: () => void;
  onCreate: (data: { name: string; content: string }) => Promise<void>;
};

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
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 id="new-script-heading" className="text-lg font-semibold text-slate-900">
        New script
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Add a name and paste your PowerShell. Names must be unique.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        {formError && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {formError}
          </p>
        )}
        <div>
          <label htmlFor="new-name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="new-name"
            name="name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="e.g. Export-UserReport"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "new-name-error" : undefined}
          />
          {errors.name && (
            <p id="new-name-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="new-content" className="block text-sm font-medium text-slate-700">
            Script content
          </label>
          <textarea
            id="new-content"
            name="content"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="# Your script..."
            aria-invalid={errors.content ? "true" : "false"}
            aria-describedby={errors.content ? "new-content-error" : undefined}
          />
          {errors.content && (
            <p id="new-content-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.content}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
