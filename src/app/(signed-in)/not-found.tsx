import Link from "next/link";
import { NotFoundMessage } from "@/components/board";
import { Button } from "@/components/ui/button";

/** A missing page inside the signed-in shell, e.g. a Programme that was deleted. */
export default function SignedInNotFound() {
  return (
    <>
      <NotFoundMessage />
      <Button asChild variant="outline" className="mt-8">
        <Link href="/catalog">Back to the Catalog</Link>
      </Button>
    </>
  );
}
