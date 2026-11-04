import { BackLink, PageLede, PageTitle } from "@/components/board";
import { addScholarship, findInCatalog } from "@/server/catalog-actions";
import { ScholarshipForm } from "../../forms";

export default function NewScholarshipPage() {
  return (
    <>
      <BackLink href="/catalog">Catalog</BackLink>
      <PageTitle className="mt-2">Add a Scholarship</PageTitle>
      <PageLede>
        Funding applied for separately from any Programme, e.g. DAAD or Chevening. Everyone in the
        circle will see it. You can add its Deadlines and Requirements next.
      </PageLede>
      <ScholarshipForm
        action={addScholarship}
        submitLabel="Add Scholarship"
        findMatches={findInCatalog.bind(null, "scholarship")}
      />
    </>
  );
}
