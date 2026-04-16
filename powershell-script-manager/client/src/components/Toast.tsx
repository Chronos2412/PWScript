type ToastProps = {
  message: string;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[60] flex max-w-[min(90vw,24rem)] animate-toast-in items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3.5 text-sm text-slate-800 shadow-soft-lg ring-1 ring-slate-900/[0.05] backdrop-blur-md dark:border-slate-600/80 dark:bg-slate-900/95 dark:text-slate-100 dark:shadow-slate-950/50 dark:ring-white/[0.08]"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 font-medium leading-snug">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 underline-offset-2 transition hover:bg-slate-100 hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}
