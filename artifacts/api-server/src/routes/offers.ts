import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, businessesTable, slotsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateOfferBody, GetOfferParams, UpdateOfferParams, UpdateOfferBody, DeleteOfferParams, UpdateOfferStatusParams, UpdateOfferStatusBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function calcDiscount(original: number, offer: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - offer) / original) * 100 * 100) / 100;
}

router.get("/offers", requireAuth, async (req, res): Promise<void> => {
  const { status, businessId } = req.query;
  let query = db.select().from(offersTable).orderBy(offersTable.createdAt);
  const conditions = [];
  if (status && typeof status === "string") conditions.push(eq(offersTable.status, status));
  if (businessId) conditions.push(eq(offersTable.businessId, Number(businessId)));
  const offers = conditions.length > 0
    ? await db.select().from(offersTable).where(and(...conditions)).orderBy(offersTable.createdAt)
    : await db.select().from(offersTable).orderBy(offersTable.createdAt);
  res.json(offers);
});

router.post("/offers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { originalPrice, offerPrice, status, ...rest } = parsed.data;
  const discountPercent = calcDiscount(Number(originalPrice), Number(offerPrice));
  const [offer] = await db.insert(offersTable).values({
    ...rest,
    originalPrice: String(originalPrice),
    offerPrice: String(offerPrice),
    discountPercent: String(discountPercent),
    status: status ?? "Draft",
  }).returning();
  res.status(201).json(serializeOffer(offer));
});

router.get("/offers/:id", async (req, res): Promise<void> => {
  const params = GetOfferParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, params.data.id)).limit(1);
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, offer.businessId)).limit(1);
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.offerId, offer.id));
  res.json({ ...serializeOffer(offer), business, slots: slots.map(serializeSlot) });
});

router.patch("/offers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOfferParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateOfferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { originalPrice, offerPrice, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (originalPrice !== undefined) updateData.originalPrice = String(originalPrice);
  if (offerPrice !== undefined) updateData.offerPrice = String(offerPrice);
  if (originalPrice !== undefined && offerPrice !== undefined) {
    updateData.discountPercent = String(calcDiscount(Number(originalPrice), Number(offerPrice)));
  }
  const [updated] = await db.update(offersTable).set(updateData).where(eq(offersTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Offer not found" }); return; }
  res.json(serializeOffer(updated));
});

router.delete("/offers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteOfferParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(offersTable).where(eq(offersTable.id, params.data.id));
  res.status(204).send();
});

router.patch("/offers/:id/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOfferStatusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateOfferStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(offersTable).set({ status: parsed.data.status }).where(eq(offersTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Offer not found" }); return; }
  res.json(serializeOffer(updated));
});

export function serializeOffer(offer: Record<string, unknown>) {
  return {
    ...offer,
    originalPrice: Number(offer.originalPrice),
    offerPrice: Number(offer.offerPrice),
    discountPercent: Number(offer.discountPercent),
  };
}

export function serializeSlot(slot: Record<string, unknown>) {
  const capacity = Number(slot.capacity);
  const bookedCount = Number(slot.bookedCount);
  const availableCount = Math.max(0, capacity - bookedCount);
  const occupancyPercent = capacity > 0 ? Math.round((bookedCount / capacity) * 100 * 10) / 10 : 0;
  let demandLevel = "Low";
  if (occupancyPercent >= 90) demandLevel = "Critical";
  else if (occupancyPercent >= 70) demandLevel = "High";
  else if (occupancyPercent >= 40) demandLevel = "Medium";
  return { ...slot, capacity, bookedCount, availableCount, occupancyPercent, demandLevel };
}

export default router;
