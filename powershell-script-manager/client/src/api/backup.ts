async function parseError(res: Response): Promise<string> {
  const statusLine = `${res.status} ${res.statusText || "Error"}`.trim();
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return `${data.error} (${statusLine})`;
  } catch {
    /* non-JSON body */
  }
  return statusLine;
}

/** Download a JSON backup of all scripts (same format as POST /api/backup/import). */
export async function downloadBackup(): Promise<void> {
  const res = await fetch("/api/backup/export");
  if (!res.ok) throw new Error(await parseError(res));

  const cd = res.headers.get("Content-Disposition");
  let filename = "powershell-scripts-backup.json";
  const m = cd?.match(/filename="([^"]+)"/);
  if (m?.[1]) filename = m[1];

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type BackupPayload = {
  version?: number;
  exportedAt?: string;
  scripts: Array<{
    name: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

/** Replace all scripts with data from a backup file. */
export async function importBackup(payload: BackupPayload): Promise<{ imported: number }> {
  const res = await fetch("/api/backup/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ imported: number }>;
}
