import type { Script } from "../types";

const BASE = "/api/scripts";

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

export async function getScripts(): Promise<Script[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Script[]>;
}

export async function getScript(id: number): Promise<Script> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Script>;
}

export async function createScript(
  body: Pick<Script, "name" | "content">
): Promise<Script> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Script>;
}

export async function updateScript(
  id: number,
  body: Pick<Script, "name" | "content">
): Promise<Script> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Script>;
}

export async function deleteScript(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}
