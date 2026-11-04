# Better Auth reads and writes its own tables

The core module is the only code that talks to the database, with one accepted exception: Better Auth reads and writes its own tables (`member`, `session`, `account`, `verification`) through its Drizzle adapter. Routing it through the core module would mean writing and maintaining a custom Better Auth adapter, a lot of work for a handful of friends, when Better Auth only stores sign-in plumbing and every rule about who may sign in still lives in core, through the `canSignIn` check that Better Auth calls before creating a Member or a session.

## Consequences

- Core may still read and change those tables where a rule needs it. Removing a Member, or taking their email off the Allowlist, deletes their sessions in core so they are signed out at once, because Better Auth checks `canSignIn` only when a session is created.
- Columns core adds to Better Auth's tables, such as `member.removed_at`, must be nullable or have defaults, since Better Auth inserts rows without knowing about them.
