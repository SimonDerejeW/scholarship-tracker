import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogEntry } from "@/core";
import { startApplication } from "@/server/application-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";

/** Whether the Member is tracking this entry: a way to start, or a way to their Application. */
export async function Tracking({ entry }: { entry: CatalogEntry }) {
  const member = await requireMember();
  const application = await core.applicationTo(member.id, entry);

  if (!application) {
    return (
      <form action={startApplication.bind(null, entry)} className="mt-6">
        <Button type="submit">
          <Plus aria-hidden />
          Start Application
        </Button>
      </form>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p>
        You&apos;re tracking this
        <span className="text-muted-foreground"> · {application.stage}</span>
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href={`/applications/${application.id}`}>Open Application</Link>
      </Button>
    </div>
  );
}
