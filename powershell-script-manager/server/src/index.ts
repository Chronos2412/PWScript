import "dotenv/config";
import cors from "cors";
import express from "express";
import { backupRouter } from "./routes/backup.js";
import { scriptsRouter } from "./routes/scripts.js";

// Default 5050: on macOS, AirPlay Receiver often binds to 5000 and returns 403 to plain HTTP.
const PORT = Number(process.env.PORT) || 5050;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/scripts", scriptsRouter);
app.use("/api/backup", backupRouter);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
