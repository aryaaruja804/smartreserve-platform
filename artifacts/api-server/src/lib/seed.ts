import { db } from "@workspace/db";
import { usersTable, businessesTable, offersTable, slotsTable, bookingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@smartreserve.com")).limit(1);
  if (existing) {
    logger.info("Database already seeded, skipping");
    return;
  }

  logger.info("Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("password123", 10);
  await db.insert(usersTable).values({
    email: "admin@smartreserve.com",
    passwordHash,
    name: "Admin",
    role: "admin",
  });

  // Create businesses
  const [gym] = await db.insert(businessesTable).values({
    name: "Iron Peak Fitness",
    businessType: "Gym",
    ownerName: "Rahul Sharma",
    phone: "9876543210",
    email: "ironpeak@gym.com",
    address: "12 MG Road, Indiranagar",
    city: "Bangalore",
    openingTime: "05:00",
    closingTime: "23:00",
  }).returning();

  const [salon] = await db.insert(businessesTable).values({
    name: "Glam Studio",
    businessType: "Salon",
    ownerName: "Priya Menon",
    phone: "9988776655",
    email: "glam@studio.com",
    address: "34 Koregaon Park",
    city: "Pune",
    openingTime: "09:00",
    closingTime: "21:00",
  }).returning();

  const [restaurant] = await db.insert(businessesTable).values({
    name: "The Spice Route",
    businessType: "Restaurant",
    ownerName: "Vijay Kumar",
    phone: "9123456789",
    email: "spiceroute@resto.com",
    address: "56 Bandra West",
    city: "Mumbai",
    openingTime: "11:00",
    closingTime: "23:00",
  }).returning();

  const [clinic] = await db.insert(businessesTable).values({
    name: "WellnessFirst Clinic",
    businessType: "Clinic",
    ownerName: "Dr. Anjali Singh",
    phone: "9011223344",
    email: "wellness@clinic.com",
    address: "78 Anna Nagar",
    city: "Chennai",
    openingTime: "08:00",
    closingTime: "20:00",
  }).returning();

  const [turf] = await db.insert(businessesTable).values({
    name: "Champions Arena",
    businessType: "Turf",
    ownerName: "Arjun Reddy",
    phone: "9055667788",
    email: "champions@turf.com",
    address: "99 Kondapur",
    city: "Hyderabad",
    openingTime: "06:00",
    closingTime: "22:00",
  }).returning();

  // Create offers
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [gymOffer] = await db.insert(offersTable).values({
    businessId: gym.id,
    title: "Morning Fitness Bootcamp",
    description: "High-intensity training with certified coaches. Includes protein shake and locker access.",
    category: "Fitness",
    originalPrice: "2000",
    offerPrice: "1199",
    discountPercent: "40.05",
    startDate: today,
    endDate: nextMonth,
    startTime: "06:00",
    endTime: "08:00",
    terms: "Bring your own towel. No refunds within 24 hours.",
    status: "Active",
  }).returning();

  const [salonOffer] = await db.insert(offersTable).values({
    businessId: salon.id,
    title: "Full Glam Package",
    description: "Hair cut, color treatment, facial, and manicure. Premium products only.",
    category: "Beauty",
    originalPrice: "3500",
    offerPrice: "1999",
    discountPercent: "42.89",
    startDate: today,
    endDate: nextMonth,
    startTime: "10:00",
    endTime: "14:00",
    terms: "Prior appointment required. Patch test mandatory.",
    status: "Active",
  }).returning();

  const [restoOffer] = await db.insert(offersTable).values({
    businessId: restaurant.id,
    title: "Lunch Thali Feast",
    description: "Unlimited authentic North Indian thali with 12 items. Dessert included.",
    category: "Dining",
    originalPrice: "800",
    offerPrice: "449",
    discountPercent: "43.88",
    startDate: today,
    endDate: nextMonth,
    startTime: "12:00",
    endTime: "15:00",
    terms: "Valid for dine-in only. No takeaway.",
    status: "Active",
  }).returning();

  const [clinicOffer] = await db.insert(offersTable).values({
    businessId: clinic.id,
    title: "Full Body Health Checkup",
    description: "Comprehensive 47-test panel including blood work, cardiac markers, thyroid, vitamin deficiencies, and doctor consultation.",
    category: "Healthcare",
    originalPrice: "5000",
    offerPrice: "2499",
    discountPercent: "50.02",
    startDate: today,
    endDate: nextMonth,
    startTime: "08:00",
    endTime: "12:00",
    terms: "12-hour fasting required. Report in 24 hours.",
    status: "Active",
  }).returning();

  const [turfOffer] = await db.insert(offersTable).values({
    businessId: turf.id,
    title: "Weekend Football Fiesta",
    description: "Book a full turf for 90 minutes. Includes floodlights, bibs, and match balls. Referee available on request.",
    category: "Sports",
    originalPrice: "3000",
    offerPrice: "1799",
    discountPercent: "40.03",
    startDate: today,
    endDate: nextMonth,
    startTime: "17:00",
    endTime: "20:00",
    terms: "Booking cancellable up to 2 hours before slot.",
    status: "Active",
  }).returning();

  // Create slots for each offer
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Gym slots - multiple morning slots, some filling fast
  const gymSlot1 = await db.insert(slotsTable).values({ offerId: gymOffer.id, slotDate: today, startTime: "06:00", endTime: "07:00", capacity: 20, bookedCount: 16, status: "Available" }).returning();
  const gymSlot2 = await db.insert(slotsTable).values({ offerId: gymOffer.id, slotDate: today, startTime: "07:00", endTime: "08:00", capacity: 20, bookedCount: 8, status: "Available" }).returning();
  const gymSlot3 = await db.insert(slotsTable).values({ offerId: gymOffer.id, slotDate: tomorrow, startTime: "06:00", endTime: "07:00", capacity: 20, bookedCount: 12, status: "Available" }).returning();
  const gymSlot4 = await db.insert(slotsTable).values({ offerId: gymOffer.id, slotDate: tomorrow, startTime: "07:00", endTime: "08:00", capacity: 20, bookedCount: 3, status: "Available" }).returning();

  // Salon slots
  const salonSlot1 = await db.insert(slotsTable).values({ offerId: salonOffer.id, slotDate: today, startTime: "10:00", endTime: "12:00", capacity: 5, bookedCount: 4, status: "Available" }).returning();
  const salonSlot2 = await db.insert(slotsTable).values({ offerId: salonOffer.id, slotDate: today, startTime: "12:00", endTime: "14:00", capacity: 5, bookedCount: 2, status: "Available" }).returning();
  const salonSlot3 = await db.insert(slotsTable).values({ offerId: salonOffer.id, slotDate: tomorrow, startTime: "10:00", endTime: "12:00", capacity: 5, bookedCount: 1, status: "Available" }).returning();

  // Restaurant slots
  const restoSlot1 = await db.insert(slotsTable).values({ offerId: restoOffer.id, slotDate: today, startTime: "12:00", endTime: "13:30", capacity: 30, bookedCount: 25, status: "Available" }).returning();
  const restoSlot2 = await db.insert(slotsTable).values({ offerId: restoOffer.id, slotDate: today, startTime: "13:30", endTime: "15:00", capacity: 30, bookedCount: 12, status: "Available" }).returning();
  const restoSlot3 = await db.insert(slotsTable).values({ offerId: restoOffer.id, slotDate: tomorrow, startTime: "12:00", endTime: "13:30", capacity: 30, bookedCount: 5, status: "Available" }).returning();

  // Clinic slots
  const clinicSlot1 = await db.insert(slotsTable).values({ offerId: clinicOffer.id, slotDate: today, startTime: "08:00", endTime: "09:00", capacity: 10, bookedCount: 6, status: "Available" }).returning();
  const clinicSlot2 = await db.insert(slotsTable).values({ offerId: clinicOffer.id, slotDate: today, startTime: "09:00", endTime: "10:00", capacity: 10, bookedCount: 3, status: "Available" }).returning();
  const clinicSlot3 = await db.insert(slotsTable).values({ offerId: clinicOffer.id, slotDate: tomorrow, startTime: "08:00", endTime: "09:00", capacity: 10, bookedCount: 0, status: "Available" }).returning();

  // Turf slots
  const turfSlot1 = await db.insert(slotsTable).values({ offerId: turfOffer.id, slotDate: today, startTime: "17:00", endTime: "18:30", capacity: 22, bookedCount: 18, status: "Available" }).returning();
  const turfSlot2 = await db.insert(slotsTable).values({ offerId: turfOffer.id, slotDate: today, startTime: "18:30", endTime: "20:00", capacity: 22, bookedCount: 8, status: "Available" }).returning();
  const turfSlot3 = await db.insert(slotsTable).values({ offerId: turfOffer.id, slotDate: tomorrow, startTime: "17:00", endTime: "18:30", capacity: 22, bookedCount: 4, status: "Available" }).returning();

  // Seed some bookings to populate activity feed
  const bookingData = [
    { slotId: gymSlot1[0].id, offerId: gymOffer.id, name: "Arjun Mehta", phone: "9876543211", people: 2 },
    { slotId: restoSlot1[0].id, offerId: restoOffer.id, name: "Priya Sharma", phone: "9876543212", people: 3 },
    { slotId: salonSlot1[0].id, offerId: salonOffer.id, name: "Neha Patel", phone: "9876543213", people: 1 },
    { slotId: turfSlot1[0].id, offerId: turfOffer.id, name: "Rahul Verma", phone: "9876543214", people: 11 },
    { slotId: clinicSlot1[0].id, offerId: clinicOffer.id, name: "Dr. Anil Kumar", phone: "9876543215", people: 1 },
    { slotId: gymSlot2[0].id, offerId: gymOffer.id, name: "Sneha Iyer", phone: "9876543216", people: 1 },
    { slotId: restoSlot2[0].id, offerId: restoOffer.id, name: "Kabir Khan", phone: "9876543217", people: 4 },
  ];

  function makeRef() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let ref = "SR-";
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return ref;
  }

  for (const b of bookingData) {
    await db.insert(bookingsTable).values({
      slotId: b.slotId,
      offerId: b.offerId,
      customerName: b.name,
      customerPhone: b.phone,
      customerEmail: null,
      peopleCount: b.people,
      specialNote: null,
      bookingReference: makeRef(),
      status: "Confirmed",
    });
  }

  logger.info("Database seeded successfully");
}
