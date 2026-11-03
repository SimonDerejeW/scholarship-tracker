---
version: 1
slug: "src-app-signed-in-layout-tsx"
primary_target: "src/app/(signed-in)/layout.tsx"
related_targets: ["src/app/sign-in/page.tsx","src/app/not-invited/page.tsx","src/app/(signed-in)/page.tsx","src/app/(signed-in)/catalog/page.tsx","src/app/(signed-in)/catalog/programmes/[id]/page.tsx","src/app/(signed-in)/catalog/forms.tsx"]
---

# App shell and existing screens (issue #13)

Mode: Operate. Scope: the visual foundation for every screen that exists today (sign-in, not-invited, signed-in shell and nav, Upcoming placeholder, Catalog list, Programme detail, Programme add/edit, Deadlines and Requirements editors incl. the Requirement pool). Upcoming's real list and split-flap counters are #8, not this.

Audience and job: Members check what's due on a phone and enter Catalog research on a laptop. Every screen must read as a working tool first. Copy uses GLOSSARY.md terms; the board is visual only. Dark only (user decision). Components from shadcn, restyled to tokens.

Unresolved: none for this ticket. #8 inherits this world and adds the split-flap counters.

## Direction contract

THESIS: The whole app is one departures board: a near-black hall where amber marks what is current and soonest, and every list reads as rows on the board. It refuses the stock tracker look of white cards, grey text and coloured pills.

OWN-WORLD: Board #0E1116 ground, row band #161A21 alternating, hairline #262B34 rules, off-white #F2F2F2 text, mute #8B93A1, amber #F4C430 for current nav, dates and the primary action, green #3BB273 for moving Stages, red #E5484D only for Missed (errors are ink with an alert icon and an edge border). Barlow Condensed caps for chrome, headings, labels and figures; Barlow for body. Tabular figures. Small radii (4px), no shadows, no cards: rows and rules.

STORY: A Member lands, recognises the board, and knows where they are from the amber tab; they scan rows, tap one, edit it with plain dark form controls, and every change reads as an update to the shared board.

FIRST VIEWPORT: Phone Catalog: board-dark header with SCHOLARSHIP TRACKER in condensed caps and the member menu; nav tabs UPCOMING / CATALOG with an amber underline on the current one; page title CATALOG in 34px condensed caps with an amber-filled ADD PROGRAMME button on its right; below, full-width banded rows, each a Programme name in condensed semibold (typed case) over university · country in Barlow mute. Desktop widens the column to ~960px.

FORM: The Departures Board, IMPECCABLE'S PICK card (my grounded #1), chosen by the user in the direction round. seed:ffb225bcdadbf59b

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
