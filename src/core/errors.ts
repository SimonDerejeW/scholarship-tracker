/** The input breaks a rule; the message is fit to show the Member. */
export class InvalidInputError extends Error {
  name = "InvalidInputError";
}

/** The thing acted on doesn't exist, perhaps because another Member removed it. */
export class NotFoundError extends Error {
  name = "NotFoundError";
}

/** The Member may not do this; the message says why and is fit to show them. */
export class NotAllowedError extends Error {
  name = "NotAllowedError";
}
