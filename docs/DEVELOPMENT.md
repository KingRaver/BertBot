# Development

- `npm run dev` uses `tsx` to hot reload.
- `npm run build` outputs to `dist/`.
- `npm run start` runs the compiled server.

## Notes
- The WebChat static files are served from `src/` in dev and `dist/` in production.
- Tool calling is implemented via a lightweight JSON protocol to stay provider-agnostic.
- Session persistence is opt-in via config (`sessions.persist`).
- The system prompt is loaded from `workspace/AGENTS.md` if present.
