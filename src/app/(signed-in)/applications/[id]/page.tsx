import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Loading, PageTitle, SectionHeading } from "@/components/board";
import { STAGES } from "@/core";
import {
  addPersonalItem,
  deleteApplication,
  deletePersonalItem,
  editApplicationNotes,
  editPersonalItem,
  setStage,
  tickPersonalItem,
  tickRequirement,
} from "@/server/application-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { entryHref, KIND_NAMES } from "../../catalog/routes";
import { Checklist } from "./checklist";
import { DeleteApplication, NotesForm, StagePicker } from "./controls";

export default function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  return (
    <>
      <BackLink href="/">Upcoming</BackLink>
      <Suspense fallback={<Loading />}>
        <Application params={params} />
      </Suspense>
    </>
  );
}

async function Application({ params }: Pick<PageProps<"/applications/[id]">, "params">) {
  const member = await requireMember();
  const { id } = await params;
  const application = /^\d+$/.test(id) ? await core.getApplication(member.id, Number(id)) : null;
  const checklist = application && (await core.getChecklist(member.id, application.id));
  if (!application || !checklist) {
    notFound();
  }
  const { entry } = application;

  return (
    <article>
      <p className="mt-2 board-caps text-label font-semibold text-muted-foreground">
        {KIND_NAMES[entry.kind]} Application
      </p>
      <PageTitle entryName className="mt-1">
        {entry.name}
      </PageTitle>
      <p className="mt-2 text-lg">{entry.detail}</p>
      <p className="mt-3">
        <Link
          href={entryHref(entry)}
          className="inline-flex min-h-11 items-center underline decoration-edge underline-offset-4 transition-colors duration-150 hover:text-amber hover:decoration-amber"
        >
          Deadlines and Requirements in the Catalog
        </Link>
      </p>

      <section className="mt-10">
        <SectionHeading>Stage</SectionHeading>
        <StagePicker
          stages={STAGES}
          stage={application.stage}
          setStage={setStage.bind(null, application.id)}
        />
      </section>

      <section className="mt-10">
        <Checklist
          checklist={checklist}
          kindName={KIND_NAMES[entry.kind]}
          tickRequirement={tickRequirement.bind(null, application.id)}
          tickPersonalItem={tickPersonalItem}
          addPersonalItem={addPersonalItem.bind(null, application.id)}
          editPersonalItem={editPersonalItem}
          deletePersonalItem={deletePersonalItem}
        />
      </section>

      <section className="mt-10">
        <SectionHeading>Notes</SectionHeading>
        <NotesForm
          notes={application.notes}
          action={editApplicationNotes.bind(null, application.id)}
        />
      </section>

      <div className="mt-10 border-t border-rule pt-4">
        <DeleteApplication action={deleteApplication.bind(null, application.id)} />
      </div>
    </article>
  );
}
