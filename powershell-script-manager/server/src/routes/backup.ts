import { Router } from "express";
import { prisma } from "../db.js";

export const backupRouter = Router();

const BACKUP_VERSION = 1;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

type ImportScript = {
  name?: unknown;
  content?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/** GET /export — full JSON backup of all scripts (for moving to another machine). */
backupRouter.get("/export", async (_req, res) => {
  try {
    const scripts = await prisma.script.findMany({ orderBy: { name: "asc" } });
    const exportedAt = new Date().toISOString();
    const payload = {
      version: BACKUP_VERSION,
      exportedAt,
      scripts: scripts.map((s) => ({
        id: s.id,
        name: s.name,
        content: s.content,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
    const safeDate = exportedAt.slice(0, 10);
    const filename = `powershell-scripts-backup-${safeDate}.json`;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`${JSON.stringify(payload, null, 2)}\n`);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to export backup" });
  }
});

/** POST /import — replace all scripts with data from an export file. */
backupRouter.post("/import", async (req, res) => {
  const body = req.body as { version?: unknown; scripts?: unknown };
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (!Array.isArray(body.scripts)) {
    return res.status(400).json({ error: "Missing or invalid \"scripts\" array" });
  }

  const items = body.scripts as ImportScript[];
  const seenNames = new Set<string>();
  const normalized: {
    name: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    if (!row || typeof row !== "object") {
      return res.status(400).json({ error: `Invalid script at index ${i}` });
    }
    if (!isNonEmptyString(row.name)) {
      return res.status(400).json({ error: `Script at index ${i} needs a non-empty name` });
    }
    if (!isNonEmptyString(row.content)) {
      return res.status(400).json({ error: `Script at index ${i} needs non-empty content` });
    }
    const nameKey = row.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) {
      return res.status(400).json({ error: `Duplicate script name in file: "${row.name.trim()}"` });
    }
    seenNames.add(nameKey);

    let createdAt = new Date();
    let updatedAt = new Date();
    if (typeof row.createdAt === "string") {
      const d = new Date(row.createdAt);
      if (!Number.isNaN(d.getTime())) createdAt = d;
    }
    if (typeof row.updatedAt === "string") {
      const d = new Date(row.updatedAt);
      if (!Number.isNaN(d.getTime())) updatedAt = d;
    }

    normalized.push({
      name: row.name.trim(),
      content: row.content,
      createdAt,
      updatedAt,
    });
  }

  try {
    const imported = await prisma.$transaction(async (tx) => {
      await tx.script.deleteMany({});
      for (const s of normalized) {
        await tx.script.create({
          data: {
            name: s.name,
            content: s.content,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          },
        });
      }
      return normalized.length;
    });
    res.status(200).json({ imported, message: "Backup imported successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to import backup" });
  }
});
