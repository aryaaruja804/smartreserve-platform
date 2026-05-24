import { Router } from "express";
import { db } from "@workspace/db";
import { slotsTable, offersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListSlotsParams, CreateSlotParams, CreateSlotBody, UpdateSlotParams, UpdateSlotBody, DeleteSlotParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { serializeSlot } from "./offers";

const router = Router();

router.get("/offers/:offerId/slots", async (req, res): Promise<void> => {
  const params = ListSlotsParams.safeParse({ offerId: Number(req.params.offerId) });
  if (!params.success) { res.status(400).json({ error: "Invalid offerId" }); return; }
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.offerId, params.data.offerId)).orderBy(slotsTable.slotDate, slotsTable.startTime);
  res.json(slots.map(serializeSlot));
});

router.post("/offers/:offerId/slots", requireAuth, async (req, res): Promise<void> => {
  const params = CreateSlotParams.safeParse({ offerId: Number(req.params.offerId) });
  if (!params.success) { res.status(400).json({ error: "Invalid offerId" }); return; }
  const parsed = CreateSlotBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, params.data.offerId)).limit(1);
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  const [slot] = await db.insert(slotsTable).values({ ...parsed.data, offerId: params.data.offerId }).returning();
  res.status(201).json(serializeSlot(slot as unknown as Record<string, unknown>));
});

router.patch("/slots/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateSlotParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateSlotBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(slotsTable).set(parsed.data).where(eq(slotsTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Slot not found" }); return; }
  res.json(serializeSlot(updated as unknown as Record<string, unknown>));
});

router.delete("/slots/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSlotParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(slotsTable).where(eq(slotsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
