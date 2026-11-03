import { addProgramme } from "@/server/catalog-actions";
import { ProgrammeForm } from "../../forms";

export default function NewProgrammePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Add a Programme</h1>
      <p className="mt-1 text-foreground/60">
        Everyone in the circle will see it. You can add its Deadlines and Requirements next.
      </p>
      <ProgrammeForm action={addProgramme} submitLabel="Add Programme" />
    </>
  );
}
