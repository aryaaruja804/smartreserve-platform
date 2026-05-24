import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateBusinessBody, GetBusinessParams, UpdateBusinessParams, UpdateBusinessBody, DeleteBusinessParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/businesses", requireAuth, async (req, res): Promise<void> => {
  const businesses = await db.select().from(businessesTable).orderBy(businessesTable.createdAt);
  res.json(businesses);
});

router.post("/businesses", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db.insert(businessesTable).values(parsed.data).returning();
  res.status(201).json(business);
});

router.get("/businesses/:id", async (req, res): Promise<void> => {
  const params = GetBusinessParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, params.data.id)).limit(1);
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(business);
});

router.patch("/businesses/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBusinessParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(businessesTable).set(parsed.data).where(eq(businessesTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(updated);
});

router.delete("/businesses/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteBusinessParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(businessesTable).where(eq(businessesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
