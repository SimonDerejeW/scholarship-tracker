# scholarship-tracker

## UI

All UI follows `DESIGN.md`: The Departures Board, dark only. Product context is in `PRODUCT.md`.

- Components come from shadcn (MCP in `.mcp.json`), restyled to the design tokens. Never ship the stock shadcn look or hard-coded colours.
- UI copy uses `GLOSSARY.md` terms; the board metaphor is visual only.
- During ticket builds (`/implement`, `/implement-spec`), follow `DESIGN.md` directly and extend existing patterns. Don't invoke the `impeccable` skill: its design rounds wait for the user to choose, which stalls unattended builds. The user runs impeccable separately at review points.

## Agent skills

### Issue tracker

Issues and specs live as GitHub Issues on SimonDerejeW/scholarship-tracker (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
