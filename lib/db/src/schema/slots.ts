import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { offersTable } from "./offers";

export const slotsTable = pgTable("slots", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => offersTable.id, { onDelete: "cascade" }),
  slotDate: text("slot_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  capacity: integer("capacity").notNull(),
  bookedCount: integer("booked_count").notNull().default(0),
  status: text("status").notNull().default("Available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSlotSchema = createInsertSchema(slotsTable).omit({ id: true, bookedCount: true, createdAt: true, updatedAt: true });
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Slot = typeof slotsTable.$inferSelect;
