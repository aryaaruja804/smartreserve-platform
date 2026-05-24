import { db } from "@workspace/db";
import { bookingsTable, slotsTable, offersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { broadcastUpdate } from "./websocket";
import { logger } from "./logger";

const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Sneha", "Karthik", "Ananya", "Vikram", "Divya",
  "Rohit", "Meera", "Amit", "Sanya", "Suresh", "Kavya", "Nikhil", "Pooja",
  "Aditya", "Nisha", "Rajesh", "Sunita", "Kabir", "Ishaan", "Zara", "Riya",
  "Manish", "Deepa", "Varun", "Lakshmi", "Siddharth", "Anjali",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Iyer", "Kumar", "Singh", "Nair", "Reddy", "Joshi",
  "Mehta", "Gupta", "Verma", "Shah", "Das", "Rao", "Pillai", "Khan",
  "Malhotra", "Choudhary", "Bose", "Kapoor",
];

function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "SR-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function randomPhone(): string {
  return `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
}

async function simulateBooking(): Promise<void> {
  try {
    const availableSlots = await db
      .select({
        slotId: slotsTable.id,
        offerId: slotsTable.offerId,
        capacity: slotsTable.capacity,
        bookedCount: slotsTable.bookedCount,
        startTime: slotsTable.startTime,
        endTime: slotsTable.endTime,
        offerTitle: offersTable.title,
      })
      .from(slotsTable)
      .innerJoin(offersTable, eq(slotsTable.offerId, offersTable.id))
      .where(
        and(
          eq(slotsTable.status, "Available"),
          eq(offersTable.status, "Active"),
          sql`${slotsTable.bookedCount} < ${slotsTable.capacity}`,
        ),
      );

    if (availableSlots.length === 0) return;

    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    const customerName = randomName();
    const bookingReference = generateRef();

    await db.insert(bookingsTable).values({
      slotId: slot.slotId,
      offerId: slot.offerId,
      customerName,
      customerPhone: randomPhone(),
      customerEmail: null,
      peopleCount: 1,
      specialNote: null,
      bookingReference,
      status: "Confirmed",
    });

    const newBookedCount = slot.bookedCount + 1;
    const newStatus = newBookedCount >= slot.capacity ? "Full" : "Available";
    await db
      .update(slotsTable)
      .set({ bookedCount: newBookedCount, status: newStatus })
      .where(eq(slotsTable.id, slot.slotId));

    broadcastUpdate("new_booking", {
      id: Date.now(),
      offerTitle: slot.offerTitle,
      customerName,
      slotTime: `${slot.startTime}–${slot.endTime}`,
      bookingReference,
    });

    const [stats] = await db
      .select({
        totalCap: sql<string>`coalesce(sum(capacity), 0)`,
        totalBooked: sql<string>`coalesce(sum(booked_count), 0)`,
      })
      .from(slotsTable);

    const totalCap = Number(stats?.totalCap ?? 0);
    const totalBooked = Number(stats?.totalBooked ?? 0);
    const liveOccupancy = totalCap > 0 ? Math.round((totalBooked / totalCap) * 1000) / 10 : 0;

    broadcastUpdate("stats_update", { liveOccupancy });

    logger.info({ customerName, offerTitle: slot.offerTitle }, "Simulated booking");
  } catch (err) {
    logger.warn({ err }, "Demand simulation error (non-fatal)");
  }
}

export function startDemandSimulator(): void {
  const schedule = () => {
    const delay = 12000 + Math.random() * 18000;
    setTimeout(async () => {
      await simulateBooking();
      schedule();
    }, delay);
  };

  setTimeout(async () => {
    await simulateBooking();
    schedule();
  }, 6000);

  logger.info("Demand simulator started");
}
