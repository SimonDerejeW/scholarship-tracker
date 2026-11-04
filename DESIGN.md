---
name: Scholarship Tracker
description: A private departures board for a small circle tracking master's Programmes, Scholarships and Applications.
colors:
  board: "#0e1116"
  band: "#161a21"
  band-hover: "#1e232b"
  rule: "#262b34"
  edge: "#5c6575"
  ink: "#f2f2f2"
  mute: "#8b93a1"
  amber: "#f4c430"
  moving: "#3bb273"
  missed: "#e5484d"
  flap: "#05070a"
  flap-split: "#000000"
typography:
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.02em"
  title-entry-name:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  section:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.04em"
  entry:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    lineHeight: 1.2
  control:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  column-label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\""
rounded:
  sm: "4px"
spacing:
  gutter: "16px"
  row-y: "12px"
  field-gap: "24px"
  section-gap: "40px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.board}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.band-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.band-hover}"
    textColor: "{colors.ink}"
  button-sm:
    typography: "{typography.label}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.band}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  nav-tab:
    textColor: "{colors.mute}"
    typography: "{typography.control}"
    height: "44px"
  nav-tab-current:
    textColor: "{colors.amber}"
  board-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  board-row-banded:
    backgroundColor: "{colors.band}"
  board-row-hover:
    backgroundColor: "{colors.band-hover}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  pool-chip:
    backgroundColor: "{colors.band}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    height: "40px"
  error-note:
    backgroundColor: "{colors.band}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
---

# Design System: Scholarship Tracker

## Overview

**Creative North Star: "The Departures Board"**

The whole app is one departures board: a near-black hall where amber marks what is current and soonest, and every list reads as rows on the board. A Member recognises the board on landing, knows where they are from the amber tab, scans banded rows, taps one, and edits it with plain dark form controls. Every change reads as an update to the shared board.

It is a working tool first. Density is calm rather than packed: one centred column, generous row height, condensed caps carrying the chrome so the content (Programme names, dates, notes) can stay in plain Barlow or its typed case. The world refuses the stock tracker look of white cards, grey text and coloured pills.

The metaphor is visual only. Copy speaks the product's own vocabulary from GLOSSARY.md; nothing on screen says "gate", "boarding" or "flight". There is no light theme.

**Key Characteristics:**
- Dark only: board ground, alternating row bands, hairline rules.
- Amber is scarce and always means "current, soonest, or the thing to do".
- Barlow Condensed caps for chrome, headings, labels, buttons and figures; Barlow for body; entry names keep their typed case.
- Tabular figures everywhere.
- Flat: no shadows, no cards, no pills. Rows and rules, 4px corners.

## Colors

A near-black, blue-cast board with one warm signal colour and two reserved status colours.

### Primary
- **Board Amber** (`amber`): the signal. Marks the current nav tab (text and 3px underline), dates in date columns and days left on Upcoming, and the filled primary action. On Upcoming it also lights an Interested Application due within 30 days (a 3px left rule and its Stage word): that is the soonest thing to do, so it counts as "dates and days left". It is also the interaction colour: the 2px focus outline, the text caret and text selection. Link hover turns amber; links at rest do not.

### Secondary
- **Moving Green** (`moving`): the Stage word on Upcoming when an Application is moving (Preparing, Submitted, Interview). Nothing else.

### Tertiary
- **Missed Red** (`missed`): the Missed flag on Upcoming: the MISSED word in the days column and the row's Stage word. It is mapped to shadcn's destructive role, but nothing else may render it.

### Neutral
- **Departures Hall** (`board`): the page ground, header and form backgrounds. The browser theme colour is the same value, written as the one sanctioned literal hex in the viewport metadata because Next metadata cannot read CSS variables.
- **Row Band** (`band`): alternate (odd) board rows, input and checkbox fills, empty-board panels, error notes, pool chips.
- **Band Lit** (`band-hover`): hover on row links, outline and ghost buttons, pool chips.
- **Hairline** (`rule`): the default border on everything: row rules, the header's bottom rule, section heading underlines, column strip rules.
- **Edge** (`edge`): the visible stroke on things you interact with or that need a frame: inputs, outline buttons, tags, chips, error notes, link underlines, scrollbar thumb.
- **Board Ink** (`ink`): primary text, and the text on every non-primary button.
- **Flap** (`flap`, `flap-split`): the split-flap tiles' face, a shade below the board, and the hairline splitting each tile across its middle.
- **Mute** (`mute`): secondary text: ledes, hints, university/country lines, column strips, inactive nav tabs, the back link, placeholders; also the hover stroke on inputs and checkboxes.

### Named Rules
**The Three Ambers Rule.** Outside focus, caret and selection, amber marks exactly three things: the current nav item, dates (and days left), and the primary action. If a fourth thing wants amber, it does not get it. The one extension of "dates" is Upcoming's 30-day highlight (left rule and Stage word): it flags the soonest Deadline to act on.

**The Red Means Missed Rule.** Red is only the Missed flag. Errors are ink text with an alert icon inside an edge-bordered band (ErrorNote); an invalid input swaps its edge stroke for ink. Never red.

**The Tokens Only Rule.** Components read the semantic tokens (shadcn roles mapped onto the palette); no component carries a literal colour.

## Typography

**Display Font:** Barlow Condensed 500/600/700 (with Barlow, system-ui, sans-serif)
**Body Font:** Barlow 400/500/600 (with system-ui, sans-serif)

**Character:** Barlow Condensed in caps is the board's lettering: tall, tight, legible at a glance. Barlow is its quieter sibling for reading. Both load through next/font.

### Hierarchy
- **Title** (700, 2.125rem, 1.05, 0.02em, uppercase): page titles (CATALOG, UPCOMING, NOT FOUND), and the sign-in wordmark.
- **Title, entry name** (700, 2.125rem, 1.05, 0.005em, typed case): a page whose title is a Catalog entry, e.g. a Programme's or Scholarship's name on its page, under a mute label-caps line naming its kind (PROGRAMME, SCHOLARSHIP).
- **Section** (700, 1.375rem, 1.1, 0.04em, uppercase): section headings over a hairline, e.g. DEADLINES, REQUIREMENTS, ADD A DEADLINE.
- **Entry** (600, 1.1875rem, 1.2): the lead line of a board row (Programme name in typed case), date figures (uppercase, amber), empty-board titles (caps).
- **Control** (600, 1rem, 0.06em, uppercase): buttons, nav tabs, the header wordmark (at 1.125rem, 700).
- **Label** (600, 0.875rem, 1.2, 0.06em, uppercase): form labels, tags, small buttons, the weekday/year line under a date, the kind line over an entry name, the COVERS label on a Scholarship.
- **Column label** (600, 0.875rem, 1.2, 0.1em, uppercase, mute): the column strip above board rows.
- **Body** (400, 1rem, 1.5): everything readable: notes, ledes, row detail. Ledes and notes cap at 65ch. Secondary lines drop to 0.875rem in mute.

### Named Rules
**The Typed Case Rule.** Entry names (Programmes, Scholarships, Requirements, Deadlines) keep the case the Member typed. Never uppercase them, not in titles, rows, or the back link. Condensed caps are for chrome, headings, labels, buttons and figures.

**The Tabular Figures Rule.** Figures are tabular everywhere (set once on the root), so dates and counts align down a column like a real board.

## Layout

One centred column. The board column is 60rem (960px) wide with a 16px side gutter; forms sit inside it at a 36rem (576px) maximum; standalone pages (sign-in, not-invited, root not-found) use a narrow 24rem column, vertically centred.

The shell is a header with the wordmark and member menu on one line and the nav tabs on the next, closed by a hairline that the current tab's underline overlaps. Main content starts 24px below (32px from the sm breakpoint) and ends with 64px of runout.

One extra breakpoint, `wide` (60rem, the board column's width), is where Upcoming spreads into its full five columns.

Board rows go full-bleed on a phone (they bleed through the 16px gutter) and sit inside the column from 640px up. On a phone each row stacks its lead line over a mute detail line joined by a middle dot; from 640px up the column strip appears and rows become a grid (Catalog: a 96px Deadline column, then Programme 1.6fr, University 1.2fr, Country 0.7fr, or Scholarship 1.6fr, Provider 1fr, Covers 0.9fr; Requirements: two equal columns; Deadlines: a 96px date column then the label). Editor rows take their grid from a per-list column variable: date fields fixed at 11rem, text fields sharing the rest, then the buttons.

Rhythm: rows pad 12px by 16px; form fields stack 24px apart (label to input 8px); sections open 40px below the previous one; the page title and its primary action, when the view has one, share a bottom-aligned line. Every touch target is at least 44px tall (40px for pool chips).

## Elevation & Depth

None. The system is flat and conveys depth only by tone: the board ground, a slightly lifted band on alternate rows and panels, and a further lift on hover. Hairline rules separate, edge strokes frame what is interactive. There is no shadow token, and none in the shipped code.

### Named Rules
**The Rows And Rules Rule.** Lists are banded board rows with hairline rules and a condensed-caps column strip. No cards, no shadows, no floating surfaces.

## Shapes

Square-ish. One radius (4px) on every framed element: buttons, inputs, textareas, checkboxes, tags, pool chips, error notes. Nothing is rounded beyond that, and nothing is a pill or circle. Rows have no radius at all; they are bands between rules. Borders are 1px; the only heavier line is the 3px underline on the current nav tab.

## Components

### Buttons
Restyled shadcn (radix base), set as board lettering: condensed, semibold, uppercase, tracked 0.06em.
- **Shape:** 4px corners, 1px border (transparent unless outlined).
- **Primary:** amber fill, board-coloured text, 44px tall, 20px side padding. Used once per view for the thing to do (SIGN IN WITH GOOGLE, ADD SCHOLARSHIP on its form, ADD DEADLINE, SAVE). A view with two equal actions has no primary: the Catalog puts ADD PROGRAMME and ADD SCHOLARSHIP as small outline buttons in their boards' section headings.
- **Outline:** transparent with an edge stroke and ink text; hover fills with Band Lit. Section and entry EDIT buttons, the Catalog's ADD buttons, row SAVE, secondary page actions.
- **Ghost:** no stroke, mute text; hover fills Band Lit and turns ink. SIGN OUT, row REMOVE.
- **Small:** 36px tall, 12px padding, label size. Used for EDIT beside headings and SIGN OUT.
- **Hover / Focus:** 150ms colour transitions; primary hover drops the amber to 85%. Focus is a 2px amber outline offset 2px. Disabled is 50% opacity. Leading icons are 16px line icons.

### Chips (Requirement pool)
- **Style:** Row Band fill, edge stroke, 4px corners, 40px min height, body text (0.875rem) with the note in mute after a middle dot. Typed case, not caps.
- **State:** hover lifts to Band Lit with an amber stroke; tapping fills the add form rather than toggling a selected state.

### Tags
- **Style:** a small bordered box: transparent, edge stroke, 4px corners, label type in caps, ink text. FUNDING INCLUDED is the shipped tag.

### Inputs / Fields
- **Style:** Row Band fill, edge stroke, 4px corners, 44px tall, 12px padding, body type in ink, mute placeholders, amber caret. Textareas size to content from 112px.
- **Labels:** label type in caps above the field; "optional" sits beside it in plain lowercase mute Barlow; hints sit below in 0.875rem mute.
- **Focus:** stroke and 2px outline both turn amber. Hover lifts the stroke to mute.
- **Error / Disabled:** an invalid field swaps its stroke to ink; the message is an ErrorNote. Disabled is 50% opacity.
- **Checkbox:** 20px square, 4px corners, Row Band fill, edge stroke, with a 44px hit area.

### Navigation
- **Style:** condensed caps tabs (control type), 44px tall, 24px apart, sitting on the header's hairline.
- **States:** inactive tabs are mute and turn ink on hover; the current tab is amber with a 3px amber underline that overlaps the header rule. Same treatment on phone and desktop.
- **Back link:** a chevron and the parent's name in condensed semibold, typed case, mute turning ink on hover, 44px tall.

### Board Rows (signature)
The board itself. A list sits under a column strip (column-label type, mute, rule below). Each row is a hairline-ruled band, odd rows filled with Row Band; whole-row links lift to Band Lit on hover and take an inset focus outline. A row's lead line is entry type in typed case; detail lines are body in mute. Dates lead their row as a block: day and month in amber entry caps over weekday and year in mute label caps. Catalog rows lead with their next Deadline and are ordered by it, soonest first; an entry with no Deadlines yet shows TBA, and one whose Deadlines have all passed shows PASSED, both in mute entry caps, after the dated rows. On a phone the Catalog drops its column strip (the date block is self-explanatory), and a strip of board links with counts sits under the title so the Scholarships board is reachable without scrolling; section headings carry the same count in mute.

### Empty Board and Error Note
- **Empty board:** a Row Band panel between rules, centred, an entry-size caps title over a mute line saying what will appear and how.
- **Error note:** an alert line icon and medium ink text in an edge-bordered Row Band box, 4px corners, 12px padding. States what went wrong and how to recover.

### Upcoming (the home board)
- **Header:** UPCOMING with today's date and "Addis Ababa" in mute label caps beneath; the Stage filter (a native select restyled as an input in condensed caps: OPEN STAGES, each Stage, ALL STAGES) sits bottom-aligned on the right. The choice lives in the address (`?stage=`).
- **Rows:** each whole row is one link to its Application; no inline actions. On a phone: Date / Application / Days, with the Stage word, Checklist progress (e.g. 3/4) and the Deadline's label on the Application's second line. From `wide`: a column strip and Date / Application (name over provider or university and the Deadline's label) / Stage / Checklist / Days.
- **Days left:** split-flap tiles, amber figures on Flap, 4px corners, 32px tall, two tiles (three from 100 days), "– –" in mute for Deadline TBA, with DAYS (DAY, TODAY) in small mute caps below. They flip in once on load, staggered down the board, and are static under reduced motion.
- **Stage word:** label caps; green while moving, ink at Interested, mute once finished (Accepted, Rejected, Withdrawn), amber when highlighted, red when Missed.
- **Highlight:** an Interested Application whose next Deadline is at most 30 days off gets a 3px amber left rule and an amber Stage word.
- **Linked Applications:** a Scholarship Application linked to a Programme Application sits directly under it, its name indented behind a mute corner arrow; the pair takes the place of whichever of the two is due sooner. On the Application page, the link shows as board rows to the other Application, and a Scholarship Application picks its Programme Application from a select lettered in typed case.
- **Missed:** the last Deadline's date and the name drop to mute, the Stage word and a bold MISSED in the days column turn red. A later-Stage Application whose Deadlines have all passed shows its last date in mute and PASSED in mute caps. Entries with no Deadlines show TBA and "Deadline TBA".

## Do's and Don'ts

### Do:
- **Do** stay dark only; there is no light theme to support.
- **Do** keep amber to the current nav item, dates (and days left, and Upcoming's 30-day highlight), and the primary action, plus focus, caret and selection.
- **Do** show errors as ink text with an alert icon and an edge border (ErrorNote).
- **Do** build lists as banded board rows with hairline rules under a condensed-caps column strip.
- **Do** keep entry names in their typed case; set chrome, headings, labels, buttons and figures in condensed caps.
- **Do** use tabular figures everywhere.
- **Do** take components from shadcn and restyle them to the tokens.
- **Do** write UI copy in GLOSSARY.md terms; the board is visual only.
- **Do** make tags and chips square-ish bordered boxes (4px).

### Don't:
- **Don't** use red for anything but Missed; never for errors, validation or destructive buttons.
- **Don't** use amber for links at rest, icons, tags, or decoration; links are ink with an edge underline and turn amber only on hover.
- **Don't** use green for anything but moving Stages on Upcoming.
- **Don't** borrow departures language in copy: "Missed", never "Gate closed"; no "boarding soon".
- **Don't** uppercase Programme names or any other typed entry.
- **Don't** use cards, shadows or pills.
- **Don't** ship the stock shadcn look or hard-code a colour in a component.
