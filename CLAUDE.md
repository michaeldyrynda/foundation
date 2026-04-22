# Foundation — AI Task Observatory

## Stack

- Runtime: Bun
- Backend: Hono (server/), SQLite via bun:sqlite + Drizzle ORM
- Frontend: React 19 + Vite (client/), Tailwind CSS v4
- Real-time: SSE via chokidar filesystem watcher

## Commands

```sh
bun run dev            # Start both server (3001) + client (5173) in parallel
bun run dev:server     # Backend only with hot reload
bun run dev:client     # Frontend only with HMR
bun run build          # Production client build
bun run start          # Production mode: server serves static files on :3001
bun run db:migrate     # Apply database migrations
bun run db:generate    # Generate new migration from schema changes
```

## Project structure

- `server/` — Hono API server
  - `db/` — Drizzle schema, SQLite connection, migrations
  - `routes/` — API routes (projects, tasks, documents, SSE events)
  - `services/` — Parser (gray-matter + marked), scanner, chokidar watcher
- `client/` — React + Vite SPA
  - `src/api/` — Typed fetch client + TanStack Query hooks + SSE
  - `src/components/` — Board, detail panel, dashboard, graph, layout
  - `src/lib/` — Status config, utilities
- `data/` — SQLite database file (foundation.db)

## Key patterns

- Filesystem is the source of truth for task data. SQLite only stores project metadata (which directories to watch).
- Task status values: `pending`, `in_progress`, `complete`, `failed`. Legacy `done` is normalized to `complete` at parse time.
- Task title is extracted from `Title: ...` line in the markdown body, not from YAML frontmatter.
- SSE sends a full `snapshot` event on connect, then incremental `task:updated`/`task:added`/`task:removed` events.
- Bun.serve idleTimeout is set to 255 seconds to keep SSE connections alive.
