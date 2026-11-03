import "server-only";
import { connection } from "next/server";

/** Every Member is in Addis Ababa (PRODUCT.md): "today" is reckoned there, never in UTC. */
const circleDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Addis_Ababa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's calendar date in the circle's timezone, YYYY-MM-DD. Read at request time. */
export async function today() {
  await connection();
  return circleDate.format(new Date());
}
