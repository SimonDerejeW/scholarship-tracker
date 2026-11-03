# Scholarship Tracker

A shared tracker for a small circle of friends applying to master's programmes and scholarships: one shared catalog of what's out there, and a private record of where each person stands.

## Catalog

**Catalog**:
The shared list of Programmes and Scholarships that every member can see and add to.
_Avoid_: Database, directory, list

**Programme**:
A master's course offered by a university, with its own Deadlines and Requirements. A Programme whose single application also decides funding (e.g. Erasmus Mundus) is marked as having **funding included**, rather than paired with a Scholarship.
_Avoid_: Course, program, degree, opportunity

**Scholarship**:
A source of funding that is applied to separately from any Programme, with its own Deadlines and Requirements (e.g. DAAD, Chevening).
_Avoid_: Grant, funding, award, opportunity

**Catalog entry**:
A Programme or Scholarship in the Catalog: what an Application is made to, and what Deadlines and Requirements belong to.
_Avoid_: Opportunity, listing, item

**Deadline**:
A named calendar date by which something must be submitted for a Programme or Scholarship (e.g. "Scholarship priority", "Final, 12:00 CET"); one can have several. An exact cutoff time, if any, lives in its name.
_Avoid_: Due date, cutoff

**Requirement**:
One thing a Programme or Scholarship asks applicants to provide (e.g. CV, two reference letters, IELTS ≥ 6.5).
_Avoid_: Document, prerequisite

**Requirement pool**:
The common Requirements offered when adding one to a Programme or Scholarship: every Requirement already in the Catalog, most used first, then a built-in starter list. Picking one copies its label and usual note to be adjusted; the copy is not linked to where it came from.
_Avoid_: Template, library, preset

## Tracking

**Application**:
One Member's private attempt at a specific Programme or Scholarship, from first interest through to outcome. A Scholarship Application may name the Programme Application it would fund.
_Avoid_: Submission, entry

**Stage**:
Where an Application currently stands: Interested, Preparing, Submitted, Interview, Accepted, Rejected or Withdrawn.
_Avoid_: Status, state, step

**Interested**:
The Stage for something researched but not yet started; it keeps the item visible so it isn't forgotten.
_Avoid_: Saved, bookmarked, researched

**Missed**:
A flag on an Application still in Interested or Preparing after every Deadline of its Programme or Scholarship has passed. It is not a Stage; the Member decides what happens next.
_Avoid_: Expired, overdue, closed

**Checklist**:
An Application's list of things to complete: the current Requirements of its Programme or Scholarship, plus any Personal items, each ticked off by the Member.
_Avoid_: Todo list, progress

**Personal item**:
A Checklist item a Member adds for themselves alone, not shared to the Catalog (e.g. "ask Prof. X for reference by 20 Nov").
_Avoid_: Custom task, note

## People

**Member**:
A person invited into the circle who can see and edit the Catalog and keep their own Applications.
_Avoid_: User, friend, account

**Admin**:
The Member who controls who may join the circle by managing the Allowlist.
_Avoid_: Owner, superuser

**Allowlist**:
The email addresses permitted to sign in and become Members.
_Avoid_: Invite list, whitelist, invitations
