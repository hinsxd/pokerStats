import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, numeric } from "drizzle-orm/sqlite-core";

export const payouts = sqliteTable("payouts", {
  id: text("id").$defaultFn(() => createId()),
  place: integer("place"),
  name: text("name"),
  country: text("country"),
  prizeTwd: numeric("prizeTwd").default(0),
  buyInValue: integer("buyInValue"),
  eventId: text("eventId"),
  eventIndex: integer("eventIndex"),
  eventName: text("eventName"),
  flight: text("flight"),
});
