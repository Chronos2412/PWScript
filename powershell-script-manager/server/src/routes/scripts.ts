import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

export const scriptsRouter = Router();

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

scriptsRouter.get("/", async (_req, res) => {
  try {
    const scripts = await prisma.script.findMany({
      orderBy: { name: "asc" },
    });
    res.json(scripts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load scripts" });
  }
});

scriptsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid script id" });
  }
  try {
    const script = await prisma.script.findUnique({ where: { id } });
    if (!script) {
      return res.status(404).json({ error: "Script not found" });
    }
    res.json(script);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load script" });
  }
});

scriptsRouter.post("/", async (req, res) => {
  const { name, content } = req.body ?? {};
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!isNonEmptyString(content)) {
    return res.status(400).json({ error: "Script content is required" });
  }
  try {
    const script = await prisma.script.create({
      data: { name: name.trim(), content },
    });
    res.status(201).json(script);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(400).json({ error: "A script with this name already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Failed to create script" });
  }
});

scriptsRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid script id" });
  }
  const { name, content } = req.body ?? {};
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!isNonEmptyString(content)) {
    return res.status(400).json({ error: "Script content is required" });
  }
  try {
    const script = await prisma.script.update({
      where: { id },
      data: { name: name.trim(), content },
    });
    res.json(script);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return res.status(404).json({ error: "Script not found" });
      }
      if (e.code === "P2002") {
        return res.status(400).json({ error: "A script with this name already exists" });
      }
    }
    console.error(e);
    res.status(500).json({ error: "Failed to update script" });
  }
});

scriptsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid script id" });
  }
  try {
    await prisma.script.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ error: "Script not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Failed to delete script" });
  }
});
