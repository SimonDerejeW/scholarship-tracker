"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useActionState, useId, useRef, useState, type MouseEvent } from "react";
import { BoardColumns, BoardRows, boardRow, FormError, SectionHeading } from "@/components/board";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogEntry } from "@/core";
import type { CatalogMatch, FormState } from "@/server/catalog-actions";
import { entryHref } from "./routes";

type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

/** Finds entries already in the Catalog matching a name being typed, to catch duplicates. */
type FindMatches = (query: string) => Promise<CatalogMatch[]>;

type ProgrammeValues = {
  name: string;
  university: string;
  country: string | null;
  link: string | null;
  fundingIncluded: boolean;
  notes: string | null;
};

export function ProgrammeForm({
  action,
  programme,
  submitLabel,
  findMatches,
}: {
  action: FormAction;
  programme?: ProgrammeValues;
  submitLabel: string;
  /** Given when adding, to show matching Programmes already in the Catalog. */
  findMatches?: FindMatches;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? {
    name: programme?.name ?? "",
    university: programme?.university ?? "",
    country: programme?.country ?? "",
    link: programme?.link ?? "",
    fundingIncluded: programme?.fundingIncluded ? "on" : "",
    notes: programme?.notes ?? "",
  };

  return (
    <form action={formAction} className="mt-8 flex max-w-form flex-col gap-6">
      <NameField
        hint="e.g. MSc Data Science"
        defaultValue={values.name}
        kind="programme"
        findMatches={findMatches}
      />
      <Field label="University">
        {(id) => <Input id={id} name="university" required defaultValue={values.university} />}
      </Field>
      <Field label="Country" optional>
        {(id) => <Input id={id} name="country" defaultValue={values.country} />}
      </Field>
      <Field label="Link" optional>
        {(id) => (
          <Input id={id} name="link" type="url" placeholder="https://" defaultValue={values.link} />
        )}
      </Field>
      <FundingIncludedField defaultChecked={values.fundingIncluded === "on"} />
      <Field label="Notes" optional>
        {(id) => <Textarea id={id} name="notes" rows={4} defaultValue={values.notes} />}
      </Field>
      <FormError error={state.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

type ScholarshipValues = {
  name: string;
  provider: string;
  link: string | null;
  coverage: string | null;
  notes: string | null;
};

export function ScholarshipForm({
  action,
  scholarship,
  submitLabel,
  findMatches,
}: {
  action: FormAction;
  scholarship?: ScholarshipValues;
  submitLabel: string;
  /** Given when adding, to show matching Scholarships already in the Catalog. */
  findMatches?: FindMatches;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? {
    name: scholarship?.name ?? "",
    provider: scholarship?.provider ?? "",
    link: scholarship?.link ?? "",
    coverage: scholarship?.coverage ?? "",
    notes: scholarship?.notes ?? "",
  };

  return (
    <form action={formAction} className="mt-8 flex max-w-form flex-col gap-6">
      <NameField
        hint="e.g. DAAD Study Scholarship"
        defaultValue={values.name}
        kind="scholarship"
        findMatches={findMatches}
      />
      <Field label="Provider" hint="Who awards it, e.g. DAAD">
        {(id, hintId) => (
          <Input
            id={id}
            aria-describedby={hintId}
            name="provider"
            required
            defaultValue={values.provider}
          />
        )}
      </Field>
      <Field label="Link" optional>
        {(id) => (
          <Input id={id} name="link" type="url" placeholder="https://" defaultValue={values.link} />
        )}
      </Field>
      <Field label="What it covers" optional hint="e.g. Tuition, €992 a month, travel">
        {(id, hintId) => (
          <Input
            id={id}
            aria-describedby={hintId}
            name="coverage"
            defaultValue={values.coverage}
          />
        )}
      </Field>
      <Field label="Notes" optional>
        {(id) => <Textarea id={id} name="notes" rows={4} defaultValue={values.notes} />}
      </Field>
      <FormError error={state.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

/** How long typing pauses before looking for duplicates. */
const TYPING_PAUSE_MS = 300;

/**
 * An entry's name. When adding, existing entries matching what's typed are listed under it,
 * linking to them, so a duplicate is caught before it's created.
 */
function NameField({
  hint,
  defaultValue,
  kind,
  findMatches,
}: {
  hint: string;
  defaultValue: string;
  kind: CatalogEntry["kind"];
  findMatches?: FindMatches;
}) {
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(0);

  function lookUp(name: string) {
    if (!findMatches) {
      return;
    }
    clearTimeout(timer.current);
    const lookup = ++latest.current;
    timer.current = setTimeout(async () => {
      const found = await findMatches(name);
      // A slower, older lookup must not replace a newer one's answer.
      if (lookup === latest.current) {
        setMatches(found);
      }
    }, TYPING_PAUSE_MS);
  }

  return (
    <Field
      label="Name"
      hint={hint}
      after={
        findMatches && (
          <div role="status">
            {matches.length > 0 && <AlreadyInCatalog matches={matches} kind={kind} />}
          </div>
        )
      }
    >
      {(id, hintId) => (
        <Input
          id={id}
          aria-describedby={hintId}
          name="name"
          required
          autoComplete="off"
          defaultValue={defaultValue}
          onChange={(event) => lookUp(event.target.value)}
        />
      )}
    </Field>
  );
}

function AlreadyInCatalog({
  matches,
  kind,
}: {
  matches: CatalogMatch[];
  kind: CatalogEntry["kind"];
}) {
  return (
    <div>
      <p className="board-caps text-label font-semibold text-muted-foreground">
        Already in Catalog
      </p>
      <ul>
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              href={entryHref({ kind, id: match.id })}
              className="inline-flex min-h-10 items-center underline decoration-edge underline-offset-4 transition-colors duration-150 hover:text-amber hover:decoration-amber"
            >
              <span className="min-w-0">
                {match.name}
                <span className="text-muted-foreground"> · {match.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FundingIncludedField({ defaultChecked }: { defaultChecked: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        name="fundingIncluded"
        defaultChecked={defaultChecked}
        aria-describedby={`${id}-hint`}
        className="mt-0.5"
      />
      <div>
        <Label htmlFor={id}>Funding included</Label>
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted-foreground">
          The single application also decides funding, e.g. Erasmus Mundus.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  optional,
  after,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  /** Shown under the hint. */
  after?: React.ReactNode;
  children: (id: string, hintId?: string) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="font-sans text-sm font-normal tracking-normal text-muted-foreground normal-case">
            optional
          </span>
        )}
      </Label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {after}
    </div>
  );
}

/** One input of a Deadline or Requirement row. */
export type RowField = {
  name: string;
  label: string;
  type?: "text" | "date";
  required?: boolean;
  placeholder?: string;
};

type Row = { id: number } & Record<string, string | number | null>;

/** Values to prefill the add form with, keyed by field name. */
type Suggestion = Record<string, string | null>;

/**
 * A list of Deadlines or Requirements, each editable in place, with a form to add another.
 * The edit and remove actions take the row's id first.
 */
export function EditableList({
  rows,
  fields,
  add,
  edit,
  remove,
  rowName,
  suggestions = [],
}: {
  rows: Row[];
  fields: RowField[];
  add: FormAction;
  edit: (id: number, state: FormState, formData: FormData) => Promise<FormState>;
  remove: (id: number) => Promise<void>;
  rowName: string;
  suggestions?: Suggestion[];
}) {
  return (
    <>
      {rows.length > 0 && (
        <div className="mt-6" style={rowColumns(fields, "12rem")}>
          <BoardColumns className="hidden sm:grid sm:grid-cols-(--row-cols) sm:gap-2">
            {fields.map((field) => (
              <span key={field.name}>{field.label}</span>
            ))}
          </BoardColumns>
          <BoardRows className="border-t border-rule sm:border-t-0">
            {rows.map((row) => (
              <li key={row.id} className={boardRow}>
                <EditableRow
                  row={row}
                  fields={fields}
                  edit={edit.bind(null, row.id)}
                  remove={remove.bind(null, row.id)}
                  rowName={rowName}
                />
              </li>
            ))}
          </BoardRows>
        </div>
      )}
      <div className="mt-10">
        <SectionHeading>Add a {rowName}</SectionHeading>
      </div>
      <AddRowForm fields={fields} add={add} rowName={rowName} suggestions={suggestions} />
    </>
  );
}

function EditableRow({
  row,
  fields,
  edit,
  remove,
  rowName,
}: {
  row: Row;
  fields: RowField[];
  edit: FormAction;
  remove: () => Promise<void>;
  rowName: string;
}) {
  const [state, formAction, pending] = useActionState(edit, {});
  const values = state.values ?? row;

  function confirmRemove(event: MouseEvent) {
    if (!confirm(`Remove this ${rowName} for everyone?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className={rowGrid}>
      <RowInputs fields={fields} values={values} labels="phone" />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          Save
        </Button>
        <Button
          type="submit"
          variant="ghost"
          formAction={remove}
          formNoValidate
          onClick={confirmRemove}
        >
          Remove
        </Button>
      </div>
      <FormError error={state.error} className="sm:col-span-full" />
    </form>
  );
}

function AddRowForm({
  fields,
  add,
  rowName,
  suggestions,
}: {
  fields: RowField[];
  add: FormAction;
  rowName: string;
  suggestions: Suggestion[];
}) {
  const [state, formAction, pending] = useActionState(add, {});
  const form = useRef<HTMLFormElement>(null);

  // Copies the suggestion into the inputs and puts the cursor in the last
  // one (a Requirement's note), ready to adjust before adding.
  function prefill(suggestion: Suggestion) {
    const inputs = fields.map(
      ({ name }) => form.current?.elements.namedItem(name) as HTMLInputElement | null,
    );
    inputs.forEach((input, i) => {
      if (input) {
        input.value = suggestion[fields[i].name] ?? "";
      }
    });
    const last = inputs.at(-1);
    last?.focus();
    last?.setSelectionRange(last.value.length, last.value.length);
  }

  return (
    <>
      {suggestions.length > 0 && (
        <SuggestionPicker suggestions={suggestions} fields={fields} onPick={prefill} />
      )}
      <form
        ref={form}
        action={formAction}
        style={rowColumns(fields, "auto")}
        className={`mt-6 ${rowGrid}`}
      >
        <RowInputs fields={fields} values={state.values ?? {}} labels="always" />
        <Button type="submit" disabled={pending} className="self-start sm:self-end">
          <Plus aria-hidden />
          Add {rowName}
        </Button>
        <FormError error={state.error} className="sm:col-span-full" />
      </form>
    </>
  );
}

const COLLAPSED_SUGGESTIONS = 10;

function SuggestionPicker({
  suggestions,
  fields,
  onPick,
}: {
  suggestions: Suggestion[];
  fields: RowField[];
  onPick: (suggestion: Suggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? suggestions : suggestions.slice(0, COLLAPSED_SUGGESTIONS);
  const [first, ...rest] = fields.map(({ name }) => name);

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        Tap a common one to fill it in, then adjust it, or type your own below.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {shown.map((suggestion) => (
          <li key={suggestion[first]}>
            <button
              type="button"
              onClick={() => onPick(suggestion)}
              className="min-h-10 rounded-sm border border-edge bg-band px-3 py-1.5 text-left text-sm transition-colors duration-150 hover:border-amber hover:bg-band-hover"
            >
              {suggestion[first]}
              {rest.map(
                (name) =>
                  suggestion[name] && (
                    <span key={name} className="text-muted-foreground">
                      {" "}
                      · {suggestion[name]}
                    </span>
                  ),
              )}
            </button>
          </li>
        ))}
        {suggestions.length > COLLAPSED_SUGGESTIONS && (
          <li>
            <Button
              type="button"
              variant="link"
              onClick={() => setExpanded(!expanded)}
              className="min-h-10 px-2"
            >
              {expanded ? "Fewer" : `All ${suggestions.length}`}
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
}

/** One row's grid on desktop: a column per field, then the buttons. Stacked on a phone. */
const rowGrid = "flex flex-col gap-3 sm:grid sm:grid-cols-(--row-cols) sm:items-end sm:gap-2";

/** The grid columns for a row of fields: dates are fixed-width, text fields share the rest. */
function rowColumns(fields: RowField[], buttons: string) {
  const columns = fields.map((field) => (field.type === "date" ? "11rem" : "minmax(0,1fr)"));
  return { "--row-cols": [...columns, buttons].join(" ") } as React.CSSProperties;
}

/**
 * A row's inputs, each with its label: shown always, or only on a phone when
 * a column strip names the fields on desktop.
 */
function RowInputs({
  fields,
  values,
  labels,
}: {
  fields: RowField[];
  values: Record<string, string | number | null>;
  labels: "always" | "phone";
}) {
  const id = useId();
  return fields.map((field) => (
    <div key={field.name} className="flex min-w-0 flex-col gap-1.5">
      <Label
        htmlFor={`${id}-${field.name}`}
        className={labels === "phone" ? "sm:sr-only" : undefined}
      >
        {field.label}
      </Label>
      <Input
        id={`${id}-${field.name}`}
        name={field.name}
        type={field.type ?? "text"}
        placeholder={field.placeholder}
        required={field.required}
        defaultValue={values[field.name] ?? ""}
      />
    </div>
  ));
}
