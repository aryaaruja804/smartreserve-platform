import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { slotsTable } from "./slots";
import { offersTable } from "./offers";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  slotId: integer("slot_id").notNull().references(() => slotsTable.id, { onDelete: "cascade" }),
  offerId: integer("offer_id").notNull().references(() => offersTable.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  peopleCount: integer("people_count").notNull().default(1),
  specialNote: text("special_note"),
  bookingReference: text("booking_reference").notNull().unique(),
  status: text("status").notNull().default("Confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, bookingReference: true, status: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
