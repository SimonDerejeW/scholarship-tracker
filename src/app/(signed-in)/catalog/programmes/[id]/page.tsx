import Link from "next/link";
import { Suspense } from "react";
import { FundingIncluded } from "../../funding-included";
import { formatDate } from "../../format";
import { buttonClass } from "../../styles";
import { loadProgramme } from "./load";

export default function ProgrammePage({ params }: PageProps<"/catalog/programmes/[id]">) {
  return (
    <>
      <Link href="/catalog" className="text-sm text-foreground/60 hover:underline">
        ← Catalog
      </Link>
      <Suspense fallback={<p className="mt-4 text-foreground/60">Loading…</p>}>
        <Programme params={params} />
      </Suspense>
    </>
  );
}

async function Programme({ params }: Pick<PageProps<"/catalog/programmes/[id]">, "params">) {
  const programme = await loadProgramme(params);
  const base = `/catalog/programmes/${programme.id}`;

  return (
    <article>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{programme.name}</h1>
        <Link href={`${base}/edit`} className={`${buttonClass} shrink-0`}>
          Edit
        </Link>
      </div>
      <p className="mt-1 text-foreground/60">
        {[programme.university, programme.country].filter(Boolean).join(" · ")}
      </p>
      {programme.fundingIncluded && <FundingIncluded />}
      {programme.link && (
        <p className="mt-3">
          <a
            href={programme.link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            {programme.link}
          </a>
        </p>
      )}
      {programme.notes && <p className="mt-4 whitespace-pre-wrap">{programme.notes}</p>}

      <Section title="Deadlines" editHref={`${base}/deadlines`}>
        {programme.deadlines.length === 0 ? (
          <Empty>No Deadlines yet. Add them once they&apos;re announced.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {programme.deadlines.map((deadline) => (
              <li key={deadline.id} className="flex flex-col sm:flex-row sm:gap-4">
                <span className="shrink-0 font-medium tabular-nums sm:w-36">
                  {formatDate(deadline.date)}
                </span>
                <span>{deadline.label}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Requirements" editHref={`${base}/requirements`}>
        {programme.requirements.length === 0 ? (
          <Empty>No Requirements yet.</Empty>
        ) : (
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {programme.requirements.map((requirement) => (
              <li key={requirement.id}>
                {requirement.label}
                {requirement.note && (
                  <span className="text-foreground/60"> — {requirement.note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="mt-8 text-sm text-foreground/60">Added by {programme.addedBy.name}</p>
    </article>
  );
}

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={editHref} className={buttonClass}>
          Edit {title}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-foreground/60">{children}</p>;
}
