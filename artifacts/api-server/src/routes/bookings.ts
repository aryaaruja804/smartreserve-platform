import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, slotsTable, offersTable, businessesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateBookingBody, GetBookingParams } from "@workspace/api-zod";
import { serializeOffer, serializeSlot } from "./offers";
import { broadcastUpdate } from "../lib/websocket";

const router = Router();

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "SR-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

router.get("/bookings", async (req, res): Promise<void> => {
  const { offerId, slotId } = req.query;
  const conditions = [];
  if (offerId) conditions.push(eq(bookingsTable.offerId, Number(offerId)));
  if (slotId) conditions.push(eq(bookingsTable.slotId, Number(slotId)));

  const bookings = conditions.length > 0
    ? await db.select().from(bookingsTable).where(and(...conditions)).orderBy(bookingsTable.createdAt)
    : await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);

  const enriched = await Promise.all(bookings.map(async (b) => {
    const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, b.slotId)).limit(1);
    const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, b.offerId)).limit(1);
    return {
      ...b,
      slot: slot ? serializeSlot(slot as unknown as Record<string, unknown>) : null,
      offer: offer ? serializeOffer(offer as unknown as Record<string, unknown>) : null,
    };
  }));
  res.json(enriched);
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { slotId, customerName, customerPhone, customerEmail, peopleCount, specialNote } = parsed.data;

  // Validate phone
  if (!/^\d{10}$/.test(customerPhone)) {
    res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    return;
  }

  // Get slot
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId)).limit(1);
  if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
  if (slot.status === "Full" || slot.status === "Closed" || slot.status === "Cancelled") {
    res.status(409).json({ error: "Slot is not available for booking" });
    return;
  }

  // Get offer
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, slot.offerId)).limit(1);
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  if (offer.status !== "Active") {
    res.status(409).json({ error: "Offer is not active" });
    return;
  }

  // Check capacity
  const availableCount = slot.capacity - slot.bookedCount;
  if (peopleCount > availableCount) {
    res.status(409).json({ error: `Only ${availableCount} spots available in this slot` });
    return;
  }

  // Check duplicate booking by phone + slot
  const [existing] = await db.select().from(bookingsTable)
    .where(and(eq(bookingsTable.slotId, slotId), eq(bookingsTable.customerPhone, customerPhone)))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "You have already booked this slot with this phone number" });
    return;
  }

  const bookingReference = generateRef();

  const [booking] = await db.insert(bookingsTable).values({
    slotId,
    offerId: slot.offerId,
    customerName,
    customerPhone,
    customerEmail: customerEmail ?? null,
    peopleCount,
    specialNote: specialNote ?? null,
    bookingReference,
    status: "Confirmed",
  }).returning();

  // Update slot booked count
  const newBookedCount = slot.bookedCount + peopleCount;
  const newStatus = newBookedCount >= slot.capacity ? "Full" : "Available";
  await db.update(slotsTable).set({ bookedCount: newBookedCount, status: newStatus }).where(eq(slotsTable.id, slotId));

  // Broadcast realtime update
  broadcastUpdate("new_booking", {
    bookingId: booking.id,
    offerTitle: offer.title,
    customerName,
    slotTime: `${slot.startTime}–${slot.endTime}`,
    bookingReference,
  });

  const updatedSlot = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId)).limit(1);
  res.status(201).json({
    ...booking,
    slot: updatedSlot[0] ? serializeSlot(updatedSlot[0] as unknown as Record<string, unknown>) : null,
    offer: serializeOffer(offer as unknown as Record<string, unknown>),
  });
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, booking.slotId)).limit(1);
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, booking.offerId)).limit(1);
  res.json({
    ...booking,
    slot: slot ? serializeSlot(slot as unknown as Record<string, unknown>) : null,
    offer: offer ? serializeOffer(offer as unknown as Record<string, unknown>) : null,
  });
});

export default router;
