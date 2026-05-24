import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, slotsTable, bookingsTable, businessesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { serializeOffer, serializeSlot } from "./offers";

const router = Router();

async function buildPublicOffer(offer: Record<string, unknown>, business: Record<string, unknown>) {
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.offerId, Number(offer.id)));
  const totalCapacity = slots.reduce((s, sl) => s + sl.capacity, 0);
  const totalBooked = slots.reduce((s, sl) => s + sl.bookedCount, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 1000) / 10 : 0;
  const availableSlots = slots.filter(s => s.status === "Available" && s.bookedCount < s.capacity).length;

  const recentRows = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable)
    .where(and(
      eq(bookingsTable.offerId, Number(offer.id)),
      sql`created_at >= NOW() - INTERVAL '15 minutes'`
    ));
  const recentBookings = Number(recentRows[0]?.count ?? 0);

  const isFillingFast = occupancyPercent >= 70;
  const isTrending = recentBookings >= 2;

  // Recommend least crowded available slot
  const availSlots = slots
    .filter(s => s.status === "Available" && s.bookedCount < s.capacity)
    .sort((a, b) => (a.bookedCount / a.capacity) - (b.bookedCount / b.capacity));
  const recommendedSlotTime = availSlots[0] ? `${availSlots[0].startTime}` : null;

  let demandLevel = "Low";
  if (occupancyPercent >= 90) demandLevel = "Critical";
  else if (occupancyPercent >= 70) demandLevel = "High";
  else if (occupancyPercent >= 40) demandLevel = "Medium";

  return {
    ...serializeOffer(offer),
    business,
    totalCapacity,
    totalBooked,
    occupancyPercent,
    demandLevel,
    availableSlots,
    recentBookings,
    isTrending,
    isFillingFast,
    recommendedSlotTime,
    endDate: offer.endDate,
    endTime: offer.endTime,
  };
}

router.get("/public/offers", async (req, res): Promise<void> => {
  const { search, category, city } = req.query;
  const rows = await db.execute(sql`
    SELECT o.*, bus.id as bus_id, bus.name as bus_name, bus.business_type, bus.owner_name,
           bus.phone, bus.email, bus.address, bus.city, bus.opening_time, bus.closing_time,
           bus.logo_url, bus.banner_url
    FROM offers o
    LEFT JOIN businesses bus ON o.business_id = bus.id
    WHERE o.status = 'Active'
    ${category ? sql`AND o.category = ${category}` : sql``}
    ${city ? sql`AND bus.city ILIKE ${'%' + city + '%'}` : sql``}
    ${search ? sql`AND (o.title ILIKE ${'%' + search + '%'} OR o.description ILIKE ${'%' + search + '%'})` : sql``}
    ORDER BY o.created_at DESC
  `);

  const result = await Promise.all((rows.rows as Record<string, unknown>[]).map(async (row) => {
    const offer: Record<string, unknown> = {
      id: row.id, businessId: row.business_id, title: row.title, description: row.description,
      category: row.category, originalPrice: row.original_price, offerPrice: row.offer_price,
      discountPercent: row.discount_percent, startDate: row.start_date, endDate: row.end_date,
      startTime: row.start_time, endTime: row.end_time, terms: row.terms, status: row.status,
      bannerUrl: row.banner_url, createdAt: row.created_at,
    };
    const business: Record<string, unknown> = {
      id: row.bus_id, name: row.bus_name, businessType: row.business_type,
      ownerName: row.owner_name, phone: row.phone, email: row.email,
      address: row.address, city: row.city, openingTime: row.opening_time,
      closingTime: row.closing_time, logoUrl: row.logo_url, bannerUrl: row.banner_url,
    };
    return buildPublicOffer(offer, business);
  }));
  res.json(result);
});

router.get("/public/offers/featured", async (req, res): Promise<void> => {
  const activeOffers = await db.execute(sql`
    SELECT o.*, bus.id as bus_id, bus.name as bus_name, bus.business_type, bus.owner_name,
           bus.phone as bus_phone, bus.email as bus_email, bus.address, bus.city,
           bus.opening_time, bus.closing_time, bus.logo_url, bus.banner_url as bus_banner
    FROM offers o
    LEFT JOIN businesses bus ON o.business_id = bus.id
    WHERE o.status = 'Active'
    ORDER BY o.created_at DESC
    LIMIT 20
  `);

  const enriched = await Promise.all((activeOffers.rows as Record<string, unknown>[]).map(async (row) => {
    const offer: Record<string, unknown> = {
      id: row.id, businessId: row.business_id, title: row.title, description: row.description,
      category: row.category, originalPrice: row.original_price, offerPrice: row.offer_price,
      discountPercent: row.discount_percent, startDate: row.start_date, endDate: row.end_date,
      startTime: row.start_time, endTime: row.end_time, terms: row.terms, status: row.status,
      bannerUrl: row.banner_url, createdAt: row.created_at,
    };
    const business: Record<string, unknown> = {
      id: row.bus_id, name: row.bus_name, businessType: row.business_type,
      ownerName: row.owner_name, phone: row.bus_phone, email: row.bus_email,
      address: row.address, city: row.city, openingTime: row.opening_time,
      closingTime: row.closing_time, logoUrl: row.logo_url, bannerUrl: row.bus_banner,
    };
    return buildPublicOffer(offer, business);
  }));

  const featured = enriched.slice(0, 6);
  const trending = enriched.filter(o => o.isTrending).slice(0, 4);
  const fillingFast = enriched.filter(o => o.isFillingFast).slice(0, 4);

  res.json({ featured, trending, fillingFast });
});

router.get("/public/offers/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [offer] = await db.select().from(offersTable).where(eq(offersTable.id, id)).limit(1);
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, offer.businessId)).limit(1);
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.offerId, id)).orderBy(slotsTable.slotDate, slotsTable.startTime);

  const totalCapacity = slots.reduce((s, sl) => s + sl.capacity, 0);
  const totalBooked = slots.reduce((s, sl) => s + sl.bookedCount, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 1000) / 10 : 0;

  const [recentRows] = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable)
    .where(and(eq(bookingsTable.offerId, id), sql`created_at >= NOW() - INTERVAL '15 minutes'`));
  const recentBookings = Number(recentRows?.count ?? 0);

  const isFillingFast = occupancyPercent >= 70;
  const isTrending = recentBookings >= 2;

  let demandLevel = "Low";
  if (occupancyPercent >= 90) demandLevel = "Critical";
  else if (occupancyPercent >= 70) demandLevel = "High";
  else if (occupancyPercent >= 40) demandLevel = "Medium";

  const availSlots = slots
    .filter(s => s.status === "Available" && s.bookedCount < s.capacity)
    .sort((a, b) => (a.bookedCount / a.capacity) - (b.bookedCount / b.capacity));
  const recommendedSlot = availSlots[0];

  res.json({
    ...serializeOffer(offer as unknown as Record<string, unknown>),
    business,
    slots: slots.map(s => serializeSlot(s as unknown as Record<string, unknown>)),
    demandInfo: {
      recentBookings,
      occupancyPercent,
      demandLevel,
      isFillingFast,
      isTrending,
      recommendedSlotId: recommendedSlot?.id ?? null,
      recommendedSlotTime: recommendedSlot ? `${recommendedSlot.startTime}` : null,
    },
  });
});

router.get("/public/demand-pulse", async (req, res): Promise<void> => {
  const recentRows = await db.execute(sql`
    SELECT 
      b.id,
      o.title as offer_title,
      bus.name as business_name,
      bus.business_type,
      b.customer_name,
      b.created_at,
      s.start_time || '–' || s.end_time as slot_time
    FROM bookings b
    LEFT JOIN slots s ON b.slot_id = s.id
    LEFT JOIN offers o ON b.offer_id = o.id
    LEFT JOIN businesses bus ON o.business_id = bus.id
    ORDER BY b.created_at DESC
    LIMIT 10
  `);

  const [activeOfferCount] = await db.select({ count: sql<number>`count(*)` }).from(offersTable).where(eq(offersTable.status, "Active"));
  const slotStats = await db.execute(sql`
    SELECT 
      coalesce(sum(capacity), 0) as total_capacity,
      coalesce(sum(booked_count), 0) as total_booked
    FROM slots
  `);

  const slotRow = slotStats.rows[0] as { total_capacity: string; total_booked: string } | undefined;
  const totalCap = Number(slotRow?.total_capacity ?? 0);
  const totalBook = Number(slotRow?.total_booked ?? 0);
  const liveOccupancy = totalCap > 0 ? Math.round((totalBook / totalCap) * 1000) / 10 : 0;

  const [velocityRow] = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable)
    .where(sql`created_at >= NOW() - INTERVAL '1 hour'`);
  const bookingVelocity = Number(velocityRow?.count ?? 0);

  res.json({
    recentBookings: (recentRows.rows as {
      id: number; offer_title: string; business_name: string; business_type: string;
      customer_name: string; created_at: string; slot_time: string;
    }[]).map(r => ({
      id: r.id,
      offerTitle: r.offer_title,
      businessName: r.business_name,
      businessType: r.business_type,
      customerName: r.customer_name,
      createdAt: r.created_at,
      slotTime: r.slot_time,
    })),
    activeOffers: Number(activeOfferCount?.count ?? 0),
    liveOccupancy,
    bookingVelocity,
  });
});

export default router;
