type ToastProps = {
  message: string;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[60] flex max-w-[min(90vw,24rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
    >
      <span className="font-medium">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md px-2 py-1 text-xs text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        Dismiss
      </button>
    </div>
  );
}
