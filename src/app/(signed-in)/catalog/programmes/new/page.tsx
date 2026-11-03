import { BackLink, PageLede, PageTitle } from "@/components/board";
import { addProgramme } from "@/server/catalog-actions";
import { ProgrammeForm } from "../../forms";

export default function NewProgrammePage() {
  return (
    <>
      <BackLink href="/catalog">Catalog</BackLink>
      <PageTitle className="mt-2">Add a Programme</PageTitle>
      <PageLede>
        Everyone in the circle will see it. You can add its Deadlines and Requirements next.
      </PageLede>
      <ProgrammeForm action={addProgramme} submitLabel="Add Programme" />
    </>
  );
}
