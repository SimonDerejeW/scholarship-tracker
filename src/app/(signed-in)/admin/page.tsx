import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  BoardRows,
  boardRow,
  EmptyBoard,
  Loading,
  PageLede,
  PageTitle,
  SectionHeading,
  Tag,
} from "@/components/board";
import { addToAllowlist, removeFromAllowlist, removeMember } from "@/server/admin-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { AddToAllowlist, RemoveFromAllowlist, RemoveMember } from "./controls";

export default function AdminPage() {
  return (
    <>
      <PageTitle>Admin</PageTitle>
      <PageLede>Who may sign in, and who is in the circle.</PageLede>
      <Suspense fallback={<Loading />}>
        <Admin />
      </Suspense>
    </>
  );
}

async function Admin() {
  const admin = await requireMember();
  // Members who aren't the Admin are told there's nothing here.
  if (!(await core.isAdmin(admin.id))) {
    notFound();
  }
  const [allowlist, members] = await Promise.all([
    core.listAllowlist(admin.id),
    core.listMembers(admin.id),
  ]);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section aria-labelledby="allowlist">
        <SectionHeading>
          <span id="allowlist">Allowlist</span>
        </SectionHeading>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Anyone with an email here can sign in with Google and become a Member. As the Admin, you
          can always sign in.
        </p>
        <AddToAllowlist action={addToAllowlist} />
        <div className="mt-6">
          {allowlist.length === 0 ? (
            <EmptyBoard title="Nobody on the Allowlist yet">
              Add an email above so its owner can sign in.
            </EmptyBoard>
          ) : (
            <BoardRows className="border-t border-rule">
              {allowlist.map((email) => (
                <li key={email} className={`${boardRow} flex items-center justify-between gap-2`}>
                  <span className="min-w-0 break-all">{email}</span>
                  <RemoveFromAllowlist
                    email={email}
                    action={removeFromAllowlist.bind(null, email)}
                  />
                </li>
              ))}
            </BoardRows>
          )}
        </div>
      </section>

      <section aria-labelledby="members">
        <SectionHeading>
          <span id="members">Members</span>{" "}
          <span className="text-muted-foreground">{members.length}</span>
        </SectionHeading>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Everyone who has signed in. Taking an email off the Allowlist signs that Member out but
          keeps their Applications; removing the Member deletes them.
        </p>
        <BoardRows className="mt-4 border-t border-rule">
          {members.map((member) => (
            <li key={member.id} className={`${boardRow} flex items-start justify-between gap-2`}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-display text-entry font-semibold wrap-break-word">
                    {member.name}
                  </span>
                  {member.isAdmin && <Tag>Admin</Tag>}
                  {!member.canSignIn && <Tag>Not on the Allowlist</Tag>}
                </p>
                <p className="mt-1 text-sm break-all text-muted-foreground">{member.email}</p>
              </div>
              {!member.isAdmin && (
                <RemoveMember name={member.name} action={removeMember.bind(null, member.id)} />
              )}
            </li>
          ))}
        </BoardRows>
      </section>
    </div>
  );
}
