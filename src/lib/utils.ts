import { createCn } from "cn/config";

/**
 * Class merging that knows the board's type scale (globals.css), so a text colour
 * doesn't knock out a `text-entry` size, or the reverse.
 */
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["title", "section", "entry", "label"] }] } },
});
