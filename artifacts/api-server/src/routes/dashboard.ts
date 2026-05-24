import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, slotsTable, bookingsTable, businessesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { serializeOffer } from "./offers";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const [offerStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where status = 'Active')`,
  }).from(offersTable);

  const [bookingStats] = await db.select({
    total: sql<number>`count(*)`,
    today: sql<number>`count(*) filter (where created_at::date = current_date)`,
  }).from(bookingsTable);

  const [slotStats] = await db.select({
    totalCapacity: sql<number>`coalesce(sum(capacity), 0)`,
    totalBooked: sql<number>`coalesce(sum(booked_count), 0)`,
    pendingSlots: sql<number>`count(*) filter (where status = 'Available')`,
  }).from(slotsTable);

  const revenueRows = await db.execute(sql`
    SELECT coalesce(sum(b.people_count * cast(o.offer_price as numeric)), 0) as revenue
    FROM bookings b
    LEFT JOIN offers o ON b.offer_id = o.id
    WHERE b.status = 'Confirmed'
  `);
  const revenue = Number((revenueRows.rows[0] as { revenue: string })?.revenue ?? 0);

  const totalCapacity = Number(slotStats.totalCapacity);
  const totalBooked = Number(slotStats.totalBooked);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 1000) / 10 : 0;
  const capacityUtilization = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 1000) / 10 : 0;

  const bookingsByStatusRows = await db.execute(sql`
    SELECT status, count(*) as count FROM bookings GROUP BY status
  `);
  const offersByCategoryRows = await db.execute(sql`
    SELECT category, count(*) as count FROM offers GROUP BY category ORDER BY count DESC LIMIT 8
  `);

  res.json({
    totalOffers: Number(offerStats.total),
    activeOffers: Number(offerStats.active),
    totalBookings: Number(bookingStats.total),
    totalRevenue: revenue,
    occupancyRate,
    capacityUtilization,
    todayBookings: Number(bookingStats.today),
    pendingSlots: Number(slotStats.pendingSlots),
    bookingsByStatus: (bookingsByStatusRows.rows as { status: string; count: string }[]).map(r => ({ status: r.status, count: Number(r.count) })),
    offersByCategory: (offersByCategoryRows.rows as { category: string; count: string }[]).map(r => ({ category: r.category, count: Number(r.count) })),
  });
});

router.get("/dashboard/activity", requireAuth, async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const rows = await db.execute(sql`
    SELECT 
      b.id,
      'booking' as type,
      'New booking confirmed' as message,
      o.title as offer_title,
      bus.name as business_name,
      b.customer_name,
      b.created_at,
      b.booking_reference
    FROM bookings b
    LEFT JOIN offers o ON b.offer_id = o.id
    LEFT JOIN businesses bus ON o.business_id = bus.id
    ORDER BY b.created_at DESC
    LIMIT ${limit}
  `);
  const activity = (rows.rows as {
    id: number; type: string; message: string; offer_title: string;
    business_name: string; customer_name: string; created_at: string; booking_reference: string;
  }[]).map(r => ({
    id: r.id,
    type: r.type,
    message: r.message,
    offerTitle: r.offer_title,
    businessName: r.business_name,
    customerName: r.customer_name,
    createdAt: r.created_at,
    bookingReference: r.booking_reference,
  }));
  res.json(activity);
});

router.get("/dashboard/demand-analytics", requireAuth, async (req, res): Promise<void> => {
  const hourlyRows = await db.execute(sql`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      count(*) as count
    FROM bookings
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY hour
    ORDER BY hour
  `);
  const hourlyBookings = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  for (const row of hourlyRows.rows as { hour: number; count: string }[]) {
    hourlyBookings[Number(row.hour)].count = Number(row.count);
  }

  const peakHour = hourlyBookings.reduce((max, h) => h.count > max.count ? h : max, hourlyBookings[0]).hour;

  const businessTypeRows = await db.execute(sql`
    SELECT 
      bus.business_type,
      count(distinct o.id) as offers,
      count(b.id) as bookings
    FROM businesses bus
    LEFT JOIN offers o ON o.business_id = bus.id
    LEFT JOIN bookings b ON b.offer_id = o.id
    GROUP BY bus.business_type
    ORDER BY bookings DESC
  `);

  const [convResult] = await db.execute(sql`
    SELECT 
      count(*) as total_slots,
      count(*) filter (where booked_count > 0) as booked_slots
    FROM slots
  `);
  const convRow = convResult.rows[0] as { total_slots: string; booked_slots: string } | undefined;
  const conversionRate = convRow && Number(convRow.total_slots) > 0
    ? Math.round((Number(convRow.booked_slots) / Number(convRow.total_slots)) * 1000) / 10
    : 0;

  res.json({
    hourlyBookings,
    businessTypeBreakdown: (businessTypeRows.rows as { business_type: string; offers: string; bookings: string }[]).map(r => ({
      businessType: r.business_type,
      offers: Number(r.offers),
      bookings: Number(r.bookings),
    })),
    peakHour,
    conversionRate,
  });
});

router.get("/dashboard/top-offers", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT 
      o.id,
      o.title,
      bus.name as business_name,
      o.category,
      count(b.id) as total_bookings,
      coalesce(sum(b.people_count * cast(o.offer_price as numeric)), 0) as revenue,
      coalesce(sum(s.capacity), 0) as total_capacity,
      coalesce(sum(s.booked_count), 0) as total_booked
    FROM offers o
    LEFT JOIN businesses bus ON o.business_id = bus.id
    LEFT JOIN bookings b ON b.offer_id = o.id
    LEFT JOIN slots s ON s.offer_id = o.id
    GROUP BY o.id, o.title, bus.name, o.category, o.offer_price
    ORDER BY total_bookings DESC
    LIMIT 10
  `);
  res.json((rows.rows as {
    id: number; title: string; business_name: string; category: string;
    total_bookings: string; revenue: string; total_capacity: string; total_booked: string;
  }[]).map(r => ({
    id: r.id,
    title: r.title,
    businessName: r.business_name,
    category: r.category,
    totalBookings: Number(r.total_bookings),
    revenue: Number(r.revenue),
    occupancyPercent: Number(r.total_capacity) > 0
      ? Math.round((Number(r.total_booked) / Number(r.total_capacity)) * 1000) / 10
      : 0,
  })));
});

export default router;
