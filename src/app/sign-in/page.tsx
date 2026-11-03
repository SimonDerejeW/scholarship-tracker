import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorNote, PageLede } from "@/components/board";
import { Button } from "@/components/ui/button";
import { NOT_INVITED } from "@/server/auth-errors";
import { signInWithGoogle } from "@/server/auth-actions";

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="border-b border-rule pb-4 font-display text-title font-bold tracking-[0.04em] uppercase">
        Scholarship Tracker
      </h1>
      <PageLede>Sign in to see what&apos;s due.</PageLede>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <form action={signInWithGoogle} className="mt-8">
        <Button type="submit" className="w-full">
          Sign in with Google
        </Button>
      </form>
    </main>
  );
}

async function SignInError({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { error } = await searchParams;
  if (!error) {
    return null;
  }
  if (error === NOT_INVITED) {
    redirect("/not-invited");
  }
  return <ErrorNote className="mt-6">Sign-in didn&apos;t complete. Please try again.</ErrorNote>;
}
