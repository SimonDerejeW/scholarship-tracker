"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";

/** How long typing pauses before the boards follow it. */
const TYPING_PAUSE_MS = 250;

/**
 * Searches the Catalog as the Member types; the search lives in the address as `?q=`.
 * Without JavaScript, Enter submits it.
 */
export function CatalogSearch({ query }: { query: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function search(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = value.trim();
      startTransition(() =>
        router.replace(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog", { scroll: false }),
      );
    }, TYPING_PAUSE_MS);
  }

  return (
    <Form
      action="/catalog"
      replace
      scroll={false}
      role="search"
      onSubmit={() => clearTimeout(timer.current)}
      className="relative mt-4 max-w-form sm:mt-6"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        defaultValue={query}
        onChange={(event) => search(event.target.value)}
        aria-label="Search the Catalog"
        aria-busy={pending}
        placeholder="Search by name, university or provider"
        autoComplete="off"
        className="pl-9"
      />
    </Form>
  );
}
