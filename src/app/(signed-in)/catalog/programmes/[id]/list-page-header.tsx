import Link from "next/link";

/** The heading of a page that edits one of a Programme's lists. */
export function ListPageHeader({
  programme,
  title,
  children,
}: {
  programme: { id: number; name: string };
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Link
        href={`/catalog/programmes/${programme.id}`}
        className="text-sm text-foreground/60 hover:underline"
      >
        ← {programme.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-foreground/60">{children}</p>
    </>
  );
}
