---
target: "Catalog and Scholarship screens (#5)"
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/simon/dev/scholarship/src/app/(signed-in)/catalog/page.tsx"
target_fingerprint: "sha256:54ed60a87cb1340ce5c78ae5287c5d0c6bcfac3bd46ba1cf88bf371dd029b9ac"
target_path: /Users/simon/dev/scholarship/src/app/(signed-in)/catalog/page.tsx
timestamp: 2026-11-03T17-59-28Z
slug: src-app-signed-in-catalog-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Row SAVE gives no "Saved" feedback; Catalog rows show no Deadline status |
| 2 | Match System / Real World | 3 | Glossary terms used well; "What it covers" vs "Covers", editor "Label" vs view "Deadline" |
| 3 | User Control and Freedom | 3 | Back links, remove confirms; no Cancel on forms, no undo after remove |
| 4 | Consistency and Standards | 3 | Pencil on entry EDIT only; Deadline editor order label→date vs view date→label |
| 5 | Error Prevention | 2 | SAVE live on unchanged rows; unsaved row edits vanish silently |
| 6 | Recognition Rather Than Recall | 3 | Pool is strong; editor pages name entry only in back link, never its kind |
| 7 | Flexibility and Efficiency | 2 | No search/sort yet; adding a Scholarship fully takes five screens |
| 8 | Aesthetic and Minimalist Design | 3 | Calm; phone column strip repeats the section heading |
| 9 | Error Recovery | 3 | ErrorNote states the problem and keeps typed values |
| 10 | Help and Documentation | 3 | Short, useful ledes and hints |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

LLM: authored for this product (condensed caps, banded rows, amber dates, typed-case names, glossary copy). Weak spot: the Catalog list has no dates and no amber beyond the nav tab, so it reads as a dark table rather than a board; detail pages carry the identity better.
Deterministic scan: clean. `impeccable detect` 0 findings across 19 files in src/app/(signed-in)/catalog; in-page detector clean on /catalog, /catalog/scholarships/1, /catalog/scholarships/new, /catalog/scholarships/1/requirements, /catalog/programmes/1.

## What's Working

1. Two boards, each with its own small outline ADD; no competing primary.
2. One EntryDetail structure for both kinds; only the detail line differs; kind line above the name.
3. Requirement pool: prefill + cursor to note, collapsed at 10, excludes what the entry has.

## Priority Issues

- [P1] Catalog rows show no Deadline. Fix: Next Deadline column on both boards with the amber date block (mute TBA), on the detail line on phone; consider ordering by next Deadline. Command: /impeccable layout
- [P1] Scholarships board below the fold on phone. Fix: counts in section headings, jump strip on phone, drop phone column strip. Command: /impeccable adapt
- [P2] New entry lands on empty sections whose action says EDIT. Fix: ADD DEADLINES / ADD REQUIREMENTS when empty; empty line points to the pool. Command: /impeccable onboard
- [P2] Editor rows: no saved feedback, unnamed buttons. Fix: SAVE enabled only when dirty, aria-live "Saved", sr-only row names. Command: /impeccable harden
- [P3] Editor pages lack kind line; Deadline editor column order/name differs from view. Command: /impeccable clarify

## Persona Red Flags

Alex: five screens to fully add a Scholarship; one SAVE per row; rows show no next Deadline or Requirement count.
Sam: row buttons unnamed; pool chip fills silently; column strips visual only; native confirm() off-world.
Casey: Scholarships below the fold; Requirements editor ~1,700px on phone with pool at bottom; unsaved row edits lost.

## Minor Observations

- Blank COVERS cell; use a mute dash.
- Pool chips carry other entries' notes.
- All dates amber on a detail page; none marked soonest.
- Empty-state copy uneven between Deadlines and Requirements.
- "What it covers" vs "Covers".

## Questions to Consider

- If the Catalog never shows a date, is it a departures board or a dark spreadsheet?
- After Scholarship-to-Programme links ship, do Scholarships still need their own board?
- Is "Portal opens" a Deadline, once Missed depends on Deadlines?
