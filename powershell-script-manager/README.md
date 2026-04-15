# PowerShell Script Manager

A cross-platform web application for storing and managing PowerShell scripts. The UI is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. The API uses **Node.js**, **Express**, **Prisma**, and **SQLite** (a single database file in the project folder).

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)
- npm (included with Node.js)

## Quick start

From this project directory:

```bash
npm install
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173) (Vite dev server)
- **Backend API:** [http://localhost:5050](http://localhost:5050) (Express by default; see below)

The Vite dev server proxies `/api` requests to the backend, so the browser can call paths like `/api/scripts` without CORS configuration during development.

`npm install` runs `prisma generate` and `prisma db push` in the `server` workspace so the SQLite database and Prisma Client are ready before you start.

## What you can do

- **List scripts** sorted alphabetically by name, with a short preview of the content
- **Search** scripts by name (case-insensitive)
- **Create** scripts with validation on name and content
- **Open** a script in a modal to **edit**, **copy** to the clipboard, or **delete** (with confirmation)
- **Keyboard-friendly** actions: e.g. **Escape** closes the modal
- **Export backup** / **Import backup**: download all scripts as a JSON file (for moving to another computer) or replace the current library from a previously exported file

### Moving to another computer

1. On the old machine, click **Export backup** and save the downloaded `.json` file.
2. Copy that file to the new machine (USB, cloud, email, etc.).
3. On the new machine, run the app, click **Import backup**, choose the file, and confirm. This **replaces** all scripts on that machine with the backup contents.

## Database location

SQLite file (created automatically):

- `server/prisma/dev.db`

Connection string is defined in `server/.env` as:

```env
DATABASE_URL="file:./dev.db"
```

Paths are relative to the `server/prisma` directory.

## Prisma: migrations (optional)

The default setup uses `prisma db push` to sync the schema (used in `postinstall`). For versioned migrations:

```bash
cd server
npx prisma migrate dev --name init
```

## Production-style run

Build both workspaces, then start the API and serve the static client (or deploy the `client/dist` folder behind any static host):

```bash
npm run build
```

Start the API (from repo root):

```bash
npm run start -w server
```

The server serves JSON only; in production you would typically serve `client/dist` with the same host or configure the frontend’s API base URL.

## Project layout

```
powershell-script-manager/
├── client/                 # React + Vite + Tailwind
│   ├── src/
│   └── vite.config.ts      # Proxy /api → localhost:5050
├── server/                 # Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── dev.db          # SQLite (gitignored after creation)
│   └── src/
├── package.json            # Workspaces + dev script
└── README.md
```

## Troubleshooting

- **“Forbidden” / HTTP 403 when loading scripts (often on macOS):** Port **5000** is commonly used by **AirPlay Receiver**. If the API were on 5000, `http://localhost:5000/api/...` could hit AirPlay instead of Express and return **403 Forbidden**. This project defaults the API to **5050** (`server/.env` → `PORT=5050`, Vite proxy matches). If you change the API port, set `PORT` in `server/.env` and the same host/port in `client/vite.config.ts` under `server.proxy["/api"].target`.
- **Port already in use:** Change `PORT` in `server/.env` or stop the other process using ports **5050** (API) / **5173** (Vite).
- **Database locked:** Close other processes using `server/prisma/dev.db` (including Prisma Studio).
- **Clipboard in the browser:** Copy requires a secure context (`https` or `localhost`) and permission; if it fails, the UI shows an error message.

## License

This template is provided as-is for local script management.
