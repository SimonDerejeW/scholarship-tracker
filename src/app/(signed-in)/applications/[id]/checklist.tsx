"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useActionState,
  useId,
  useOptimistic,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import { BoardColumns, BoardRows, boardRow, FormError, SectionHeading } from "@/components/board";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Core } from "@/core";
import type { PersonalItemState } from "@/server/application-actions";

type ChecklistData = NonNullable<Awaited<ReturnType<Core["getChecklist"]>>>;

type ItemAction = (state: PersonalItemState, formData: FormData) => Promise<PersonalItemState>;

/** A tick or untick, shown straight away while it saves. */
type Tick = { list: "requirements" | "personalItems"; id: number; ticked: boolean };

/**
 * An Application's Checklist: its entry's Requirements, then the Member's Personal items,
 * each ticked off in place, with progress over both. The actions take the item's id first.
 */
export function Checklist({
  checklist,
  kindName,
  tickRequirement,
  tickPersonalItem,
  addPersonalItem,
  editPersonalItem,
  deletePersonalItem,
}: {
  checklist: ChecklistData;
  kindName: string;
  tickRequirement: (id: number, ticked: boolean) => Promise<void>;
  tickPersonalItem: (id: number, ticked: boolean) => Promise<void>;
  addPersonalItem: ItemAction;
  editPersonalItem: (
    id: number,
    state: PersonalItemState,
    formData: FormData,
  ) => Promise<PersonalItemState>;
  deletePersonalItem: (id: number) => Promise<void>;
}) {
  const [shown, applyTick] = useOptimistic(checklist, withTick);
  const [, startTransition] = useTransition();
  const { requirements, personalItems, progress } = shown;

  function tick(change: Tick) {
    const save = change.list === "requirements" ? tickRequirement : tickPersonalItem;
    startTransition(async () => {
      applyTick(change);
      await save(change.id, change.ticked);
    });
  }

  return (
    <>
      <SectionHeading
        action={
          <p
            aria-live="polite"
            className="board-caps text-label font-semibold text-muted-foreground"
          >
            <span className="text-foreground">{progress.done}</span> of {progress.total} done
          </p>
        }
      >
        Checklist
      </SectionHeading>

      <BoardColumns className="mt-4">Requirements</BoardColumns>
      {requirements.length > 0 ? (
        <BoardRows>
          {requirements.map((requirement) => (
            <li key={requirement.id} className={boardRow}>
              <TickBox
                ticked={requirement.ticked}
                onTick={(ticked) => tick({ list: "requirements", id: requirement.id, ticked })}
                label={requirement.label}
                note={requirement.note}
              />
            </li>
          ))}
        </BoardRows>
      ) : (
        <p className="py-3 text-sm text-muted-foreground">
          This {kindName} has no Requirements in the Catalog yet.
        </p>
      )}

      <BoardColumns className="mt-6">Personal items</BoardColumns>
      {personalItems.length > 0 && (
        <BoardRows>
          {personalItems.map((item) => (
            <li key={item.id} className={boardRow}>
              <PersonalItemRow
                item={item}
                onTick={(ticked) => tick({ list: "personalItems", id: item.id, ticked })}
                edit={editPersonalItem.bind(null, item.id)}
                remove={deletePersonalItem.bind(null, item.id)}
              />
            </li>
          ))}
        </BoardRows>
      )}
      <AddPersonalItem action={addPersonalItem} />
    </>
  );
}

function withTick(checklist: ChecklistData, { list, id, ticked }: Tick): ChecklistData {
  const item = (checklist[list] as { id: number; ticked: boolean }[]).find((i) => i.id === id);
  if (!item || item.ticked === ticked) {
    return checklist;
  }
  const { done, total } = checklist.progress;
  return {
    ...checklist,
    [list]: checklist[list].map((i) => (i.id === id ? { ...i, ticked } : i)),
    progress: { done: done + (ticked ? 1 : -1), total },
  };
}

/** A checkbox and the item it ticks off, in typed case. Ticked items are struck through. */
function TickBox({
  ticked,
  onTick,
  label,
  note,
}: {
  ticked: boolean;
  onTick: (ticked: boolean) => void;
  label: string;
  note?: string | null;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <Checkbox
        id={id}
        checked={ticked}
        onCheckedChange={(checked) => onTick(checked === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span
          className={cn(
            "block font-display text-entry font-semibold wrap-break-word transition-colors duration-150",
            ticked && "text-muted-foreground line-through decoration-edge",
          )}
        >
          {label}
        </span>
        {note && <span className="mt-1 block text-sm text-muted-foreground">{note}</span>}
      </label>
    </div>
  );
}

function PersonalItemRow({
  item,
  onTick,
  edit,
  remove,
}: {
  item: { id: number; label: string; ticked: boolean };
  onTick: (ticked: boolean) => void;
  edit: ItemAction;
  remove: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditPersonalItem label={item.label} edit={edit} done={() => setEditing(false)} />;
  }

  function confirmDelete(event: MouseEvent) {
    if (!confirm("Delete this Personal item?")) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex items-start gap-2">
      <TickBox ticked={item.ticked} onTick={onTick} label={item.label} />
      <div className="-my-3 flex shrink-0">
        <Button
          type="button"
          variant="ghost"
          aria-label={`Edit ${item.label}`}
          onClick={() => setEditing(true)}
          className="size-11 px-0"
        >
          <Pencil aria-hidden />
        </Button>
        <form action={remove}>
          <Button
            type="submit"
            variant="ghost"
            aria-label={`Delete ${item.label}`}
            onClick={confirmDelete}
            className="size-11 px-0"
          >
            <Trash2 aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}

function EditPersonalItem({
  label,
  edit,
  done,
}: {
  label: string;
  edit: ItemAction;
  done: () => void;
}) {
  const [state, formAction, pending] = useActionState<PersonalItemState, FormData>(
    async (previous, formData) => {
      const next = await edit(previous, formData);
      if (!next.error) {
        done();
      }
      return next;
    },
    {},
  );
  const id = useId();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor={id} className="sr-only">
        Personal item
      </Label>
      <Input id={id} name="label" required autoFocus defaultValue={state.label ?? label} />
      <FormError error={state.error} />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={done}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddPersonalItem({ action }: { action: ItemAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  return (
    <form action={formAction} className="mt-4 flex max-w-form flex-col gap-2">
      <Label htmlFor={id}>Add a Personal item</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="label"
          required
          defaultValue={state.label ?? ""}
          aria-describedby={`${id}-hint`}
          placeholder="e.g. Ask Prof. X for a reference"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        Only you can see your Personal items.
      </p>
      <FormError error={state.error} />
    </form>
  );
}
