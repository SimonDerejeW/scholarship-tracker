import Link from "next/link";
import { NotFoundMessage } from "@/components/board";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <NotFoundMessage />
      <Button asChild variant="outline" className="mt-8 self-start">
        <Link href="/">Back to Upcoming</Link>
      </Button>
    </main>
  );
}
