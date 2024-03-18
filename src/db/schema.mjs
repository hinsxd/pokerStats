import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const payouts = sqliteTable("payouts", {
  id: text("id").$defaultFn(() => createId()),
  place: integer("place"),
  name: text("name"),
  country: text("country"),
  prizeTwd: integer("prizeTwd"),
  buyInValue: integer("buyInValue"),
  eventId: text("eventId"),
  eventIndex: integer("eventIndex"),
  eventName: text("eventName"),
  flight: text("flight"),
});
