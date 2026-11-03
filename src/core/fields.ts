import { InvalidInputError, NotFoundError } from "./errors";

// Rules for the text Members type into Catalog forms, shared by every kind of entry.

export function required(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidInputError(message);
  }
  return trimmed;
}

export function optional(value: string | null | undefined) {
  return value?.trim() || null;
}

export function webAddress(link: string | null) {
  if (link === null) {
    return null;
  }
  const protocol = URL.parse(link)?.protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new InvalidInputError("The link must be a web address starting with http:// or https://.");
  }
  return link;
}

export function found(rows: unknown[], what: string) {
  if (rows.length === 0) {
    throw new NotFoundError(`That ${what} no longer exists.`);
  }
}

/** Whether this could be a Catalog id at all (they are Postgres integers). */
export function isId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= 2 ** 31 - 1;
}
