# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One invite-only circle of about 6–15 friends (Members) applying to master's Programmes and Scholarships at the same time, often to the same ones. One of them is the Admin, who controls the Allowlist. Not every Member talks to every other daily, so much of the Catalog arrives from people a given Member doesn't hear from directly.

Their job: keep track of many applications at once without losing a Deadline, forgetting a Programme they researched, or missing a Requirement. Each Member is juggling several university sites, scholarship portals and personal notes.

## Product Purpose

A small hosted web app with two halves:

- A shared **Catalog** of Programmes and Scholarships, each with named Deadlines and Requirements. Any Member can add or correct any entry, so research done once benefits everyone.
- Each Member's private **Applications** to Catalog entries, each with a Stage and a live Checklist (the entry's current Requirements plus the Member's Personal items).

The home screen, **Upcoming**, lists a Member's open Applications by next Deadline, with Checklist progress and days remaining. It highlights Applications still Interested within 30 days of a Deadline and flags Missed ones.

Success: no Member finds out about a Deadline too late or forgets a researched Programme until after it closes, and nobody re-types what a friend already entered.

## Positioning

A shared, wiki-editable Catalog paired with strictly private Applications (ADR 0001). The group pools research but never sees each other's choices, Stages or outcomes. Checklists follow the Catalog live (ADR 0003), so a fix one Member makes reaches everyone's tracking immediately. Researched-but-unstarted items stay on Upcoming as Interested so they resurface before their Deadline.

## Operating Context

- Research and Catalog entry (adding Programmes, Deadlines, Requirements) happen mostly on a laptop.
- Checking what's due (Upcoming, Checklists) happens on both laptop and phone; phone-browser use must work well.
- Source material lives on university sites, scholarship portals (e.g. DAAD, Chevening, Erasmus Mundus) and personal notes; entries are typed in by hand from those.
- Deadlines are calendar dates, treated as end of that day; an exact cutoff time, if any, lives in the Deadline's name (e.g. "Final, 12:00 CET").

## Capabilities and Constraints

- Vocabulary is fixed by `GLOSSARY.md` (Programme, Scholarship, Deadline, Requirement, Requirement pool, Application, Stage, Missed, Checklist, Personal item, Member, Admin, Allowlist) and should be used verbatim in the UI.
- Stages: Interested, Preparing, Submitted, Interview, Accepted, Rejected, Withdrawn. Any Stage can be set at any time. Missed is a flag, not a Stage.
- Sign-in is Google only, gated by the Allowlist; everything except sign-in and the not-invited page requires a session (ADR 0004). One circle per deployment, no multi-tenancy.
- Any Member may edit any Catalog entry; only the Member who added an entry may delete it, and only while no Application references it.
- Catalog pages must show nothing about other Members' Applications.
- Stack: Next.js + TypeScript, Postgres via Drizzle, Better Auth, Tailwind CSS, deployed to Vercel on free tiers (ADR 0002). Built and maintained by one person.
- Built so far: sign-in gate, Programmes in the Catalog, Requirement pool. Planned in GitHub issues: Scholarships, Applications, live Checklists, Upcoming, Scholarship-to-Programme links, search and duplicate suggestions, deletion, Allowlist management.
- Timezone: every Member is in Addis Ababa (`Africa/Addis_Ababa`, UTC+3, no daylight saving). "Today", days remaining, Missed and the 30-day highlight are all reckoned in that zone, never UTC; dates display in it too.

## Brand Commitments

None yet. The name "Scholarship Tracker" is a working title, and the current plain, direct copy voice is not committed; both are open.

## Evidence on Hand

- Product spec: GitHub issue #1 (user stories 1–56).
- Domain vocabulary: `GLOSSARY.md`. Decisions: `docs/adr/0001`–`0004`.
- No logo, brand assets, testimonials or usage data exist. This is a private tool for friends; do not invent social proof, user counts or outcomes.

## Product Principles

1. **Nothing slips.** Deadlines and researched-but-unstarted items must surface before it's too late; Upcoming is the product's centre.
2. **Share research, not outcomes.** The Catalog is everyone's; Applications are only yours. Never leak one Member's Stage or choices to another.
3. **Fix once, fixed for all.** Corrections to the Catalog flow to every Member's Checklist; editing should feel safe and quick.
4. **The Member stays in control.** Flags like Missed inform without changing anything; any Stage can be set at any time.
5. **Small and maintainable.** Built for a handful of friends by one person; prefer simple, conventional solutions over features for scale.
