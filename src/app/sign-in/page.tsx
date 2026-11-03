import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NOT_INVITED } from "@/server/auth-errors";
import { signInWithGoogle } from "@/server/auth-actions";

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Scholarship Tracker</h1>
        <p className="mt-1 text-foreground/60">Sign in to see what&apos;s due.</p>
      </div>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full rounded-md bg-foreground px-4 py-3 font-medium text-background hover:opacity-90"
        >
          Sign in with Google
        </button>
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
  return (
    <p role="alert" className="rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
      Sign-in didn&apos;t complete. Please try again.
    </p>
  );
}
