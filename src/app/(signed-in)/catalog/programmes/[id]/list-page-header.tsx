import { BackLink, PageLede, PageTitle } from "@/components/board";

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
      <BackLink href={`/catalog/programmes/${programme.id}`}>{programme.name}</BackLink>
      <PageTitle className="mt-2">{title}</PageTitle>
      <PageLede>{children}</PageLede>
    </>
  );
}
