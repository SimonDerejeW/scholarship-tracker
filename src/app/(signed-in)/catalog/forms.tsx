"use client";

import { useActionState, useRef, useState, type MouseEvent } from "react";
import type { FormState } from "@/server/catalog-actions";
import { buttonClass, inputClass, primaryButtonClass } from "./styles";

type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

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
}: {
  action: FormAction;
  programme?: ProgrammeValues;
  submitLabel: string;
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
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <Field label="Name" hint="e.g. MSc Data Science">
        <input name="name" required defaultValue={values.name} className={inputClass} />
      </Field>
      <Field label="University">
        <input name="university" required defaultValue={values.university} className={inputClass} />
      </Field>
      <Field label="Country" optional>
        <input name="country" defaultValue={values.country} className={inputClass} />
      </Field>
      <Field label="Link" optional>
        <input
          name="link"
          type="url"
          placeholder="https://"
          defaultValue={values.link}
          className={inputClass}
        />
      </Field>
      <label className="flex items-start gap-3">
        <input
          name="fundingIncluded"
          type="checkbox"
          defaultChecked={values.fundingIncluded === "on"}
          className="mt-1 size-4"
        />
        <span>
          <span className="font-medium">Funding included</span>
          <span className="block text-sm text-foreground/60">
            The single application also decides funding, e.g. Erasmus Mundus.
          </span>
        </span>
      </label>
      <Field label="Notes" optional>
        <textarea name="notes" rows={4} defaultValue={values.notes} className={inputClass} />
      </Field>
      <FormError error={state.error} />
      <button type="submit" disabled={pending} className={`${primaryButtonClass} self-start`}>
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">
        {label}
        {optional && <span className="font-normal text-foreground/60"> (optional)</span>}
      </span>
      {children}
      {hint && <span className="text-sm text-foreground/60">{hint}</span>}
    </label>
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
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <EditableRow
                row={row}
                fields={fields}
                edit={edit.bind(null, row.id)}
                remove={remove.bind(null, row.id)}
                rowName={rowName}
              />
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-8 font-semibold">Add a {rowName}</h2>
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
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-foreground/10 p-3 sm:flex-row sm:flex-wrap sm:items-start"
    >
      <RowInputs fields={fields} values={values} />
      <div className="flex shrink-0 gap-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          Save
        </button>
        <button
          type="submit"
          formAction={remove}
          formNoValidate
          onClick={confirmRemove}
          className={buttonClass}
        >
          Remove
        </button>
      </div>
      <FormError error={state.error} />
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
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start"
      >
        <RowInputs fields={fields} values={state.values ?? {}} />
        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} shrink-0 self-start`}
        >
          Add {rowName}
        </button>
        <FormError error={state.error} />
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
    <div className="mt-2">
      <p className="text-sm text-foreground/60">
        Tap a common one to fill it in, then adjust it, or type your own below.
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {shown.map((suggestion) => (
          <li key={suggestion[first]}>
            <button
              type="button"
              onClick={() => onPick(suggestion)}
              className="rounded-full border border-foreground/20 px-3 py-1 text-sm hover:bg-foreground/5"
            >
              {suggestion[first]}
              {rest.map(
                (name) =>
                  suggestion[name] && (
                    <span key={name} className="text-foreground/60">
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
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 text-sm underline"
            >
              {expanded ? "Fewer" : `All ${suggestions.length}`}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function RowInputs({
  fields,
  values,
}: {
  fields: RowField[];
  values: Record<string, string | number | null>;
}) {
  return fields.map((field) => (
    <input
      key={field.name}
      name={field.name}
      type={field.type ?? "text"}
      aria-label={field.label}
      placeholder={field.placeholder ?? field.label}
      required={field.required}
      defaultValue={values[field.name] ?? ""}
      className={`${inputClass} min-w-0 sm:flex-1`}
    />
  ));
}

function FormError({ error }: { error?: string }) {
  if (!error) {
    return null;
  }
  return (
    <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-300">
      {error}
    </p>
  );
}
