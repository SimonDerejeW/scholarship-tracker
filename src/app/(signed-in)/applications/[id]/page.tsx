import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  BackLink,
  BoardRows,
  boardRowLink,
  boardRowShell,
  Loading,
  PageTitle,
  SectionHeading,
} from "@/components/board";
import { STAGES } from "@/core";
import {
  addPersonalItem,
  deleteApplication,
  deletePersonalItem,
  editApplicationNotes,
  editPersonalItem,
  linkApplication,
  setStage,
  tickPersonalItem,
  tickRequirement,
} from "@/server/application-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { entryHref, KIND_NAMES } from "../../catalog/routes";
import { Checklist } from "./checklist";
import { DeleteApplication, LinkPicker, NotesForm, StagePicker } from "./controls";

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
  const [checklist, programmeApplications] = application
    ? await Promise.all([
        core.getChecklist(member.id, application.id),
        application.entry.kind === "scholarship" ? core.programmeApplications(member.id) : [],
      ])
    : [null, []];
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

      {entry.kind === "scholarship" ? (
        <section className="mt-10">
          <SectionHeading>Programme Application</SectionHeading>
          {application.funds && <LinkedApplications applications={[application.funds]} />}
          {programmeApplications.length > 0 ? (
            <>
              <LinkPicker
                options={programmeApplications.map(({ id, entry: { name, detail } }) => ({
                  id,
                  name,
                  detail,
                }))}
                value={application.funds?.id ?? null}
                link={linkApplication.bind(null, application.id)}
              />
              <p className="mt-3 max-w-form text-sm text-muted-foreground">
                The Programme Application this Scholarship would fund. Leave it unlinked until
                you choose a university.
              </p>
            </>
          ) : (
            <p className="mt-4 max-w-form text-muted-foreground">
              Start an Application to a Programme in the{" "}
              <Link
                href="/catalog"
                className="underline decoration-edge underline-offset-4 transition-colors duration-150 hover:text-amber hover:decoration-amber"
              >
                Catalog
              </Link>{" "}
              and you can link this Scholarship Application to it.
            </p>
          )}
        </section>
      ) : (
        application.fundedBy.length > 0 && (
          <section className="mt-10">
            <SectionHeading>Scholarship Applications</SectionHeading>
            <LinkedApplications applications={application.fundedBy} />
            <p className="mt-3 max-w-form text-sm text-muted-foreground">
              Scholarship Applications that would fund this one. Link or unlink them from their
              own pages.
            </p>
          </section>
        )
      )}

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

type Linked = NonNullable<Awaited<ReturnType<typeof core.getApplication>>>["fundedBy"][number];

/** Rows linking to the Member's other Applications tied to this one. */
function LinkedApplications({ applications }: { applications: Linked[] }) {
  return (
    <BoardRows className="mt-4 border-t border-rule">
      {applications.map(({ id, stage, entry }) => (
        <li key={id} className={boardRowShell}>
          <Link href={`/applications/${id}`} className={boardRowLink}>
            <span className="block font-display text-entry font-semibold">{entry.name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {entry.detail} · {stage}
            </span>
          </Link>
        </li>
      ))}
    </BoardRows>
  );
}
