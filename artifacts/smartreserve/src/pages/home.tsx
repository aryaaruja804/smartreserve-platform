import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetFeaturedOffers, useGetDemandPulse, getGetFeaturedOffersQueryKey, getGetDemandPulseQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, TrendingUp, Clock, ChevronRight, Activity, Users, Star, ArrowRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";

function OccupancyBar({ percent, className }: { percent: number; className?: string }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : percent >= 40 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className={cn("w-full h-1.5 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function DemandBadge({ level, isFillingFast, isTrending }: { level: string; isFillingFast: boolean; isTrending: boolean }) {
  if (isFillingFast) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
      <Flame className="w-3 h-3" /> Filling Fast
    </span>
  );
  if (isTrending) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
      <TrendingUp className="w-3 h-3" /> Trending
    </span>
  );
  if (level === "Low") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
      <Star className="w-3 h-3" /> Best Availability
    </span>
  );
  return null;
}

function OfferCard({ offer }: { offer: any }) {
  const savings = offer.originalPrice - offer.offerPrice;
  return (
    <Link href={`/offers/${offer.id}`}>
      <div
        data-testid={`card-offer-${offer.id}`}
        className="group relative bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-30">
              {offer.business?.businessType === "Gym" ? "🏋️" :
               offer.business?.businessType === "Salon" ? "💇" :
               offer.business?.businessType === "Restaurant" ? "🍽️" :
               offer.business?.businessType === "Clinic" ? "🏥" :
               offer.business?.businessType === "Turf" ? "⚽" : "🏢"}
            </span>
          </div>
          <div className="absolute top-3 left-3">
            <DemandBadge level={offer.demandLevel} isFillingFast={offer.isFillingFast} isTrending={offer.isTrending} />
          </div>
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-foreground">
            {Math.round(offer.discountPercent)}% OFF
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">{offer.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{offer.business?.name} · {offer.business?.city}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-foreground">₹{offer.offerPrice.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground line-through">₹{offer.originalPrice.toLocaleString()}</span>
            <span className="text-xs text-green-400 font-medium ml-auto">Save ₹{savings.toLocaleString()}</span>
          </div>
          <OccupancyBar percent={offer.occupancyPercent} className="mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {offer.availableSlots} slots left
            </span>
            <span className="flex items-center gap-1 text-primary">
              Book now <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

type LiveBooking = {
  id: number | string;
  customerName: string;
  offerTitle: string;
  slotTime: string;
};

function PulseFeed({ bookings }: { bookings: LiveBooking[] }) {
  if (!bookings.length) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {bookings.map((b, i) => (
        <div
          key={b.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/40 border border-border/50 text-sm slide-in-right"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 pulse-glow" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-foreground">{b.customerName}</span>
            <span className="text-muted-foreground"> booked </span>
            <span className="text-primary font-medium truncate">{b.offerTitle}</span>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{b.slotTime}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const queryClient = useQueryClient();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedOffers();
  const { data: pulse, isLoading: pulseLoading } = useGetDemandPulse();

  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>([]);
  const [liveOccupancy, setLiveOccupancy] = useState<number | null>(null);
  const velocityRef = useRef(0);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    if (pulse?.bookingVelocity !== undefined) {
      velocityRef.current = pulse.bookingVelocity;
      setVelocity(pulse.bookingVelocity);
    }
  }, [pulse?.bookingVelocity]);

  useRealtime((event) => {
    if (event.type === "new_booking") {
      const booking = event.data as LiveBooking;
      setLiveBookings((prev) => [booking, ...prev].slice(0, 8));
      velocityRef.current += 1;
      setVelocity(velocityRef.current);
      queryClient.invalidateQueries({ queryKey: getGetFeaturedOffersQueryKey() });
    }
    if (event.type === "stats_update") {
      const stats = event.data as { liveOccupancy?: number };
      if (stats.liveOccupancy !== undefined) {
        setLiveOccupancy(stats.liveOccupancy);
      }
    }
  });

  const displayedOccupancy = liveOccupancy ?? pulse?.liveOccupancy ?? null;
  const displayedVelocity = velocity || pulse?.bookingVelocity || 0;

  const seedBookings: LiveBooking[] = (pulse?.recentBookings ?? []).map((b: any) => ({
    id: b.id ?? b.bookingReference ?? Math.random(),
    customerName: b.customerName,
    offerTitle: b.offerTitle,
    slotTime: b.slotTime,
  }));

  const allLiveIds = new Set(liveBookings.map((b) => String(b.id)));
  const mergedBookings = [
    ...liveBookings,
    ...seedBookings.filter((b) => !allLiveIds.has(String(b.id))),
  ].slice(0, 8);

  const allFeatured = featured?.featured ?? [];
  const fillingFast = featured?.fillingFast ?? [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
            <Activity className="w-3 h-3" />
            Live demand tracking across 500+ offers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-[1.1]">
            Smart Offers.
            <br />
            <span className="gradient-text">Real-Time Demand.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Book discounted time slots at gyms, salons, restaurants and more — guided by live occupancy data and intelligent demand signals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/offers">
              <button data-testid="button-browse-offers" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all">
                Browse All Offers <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demand Pulse + Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-2xl font-bold text-foreground">{pulse?.activeOffers ?? "–"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Active offers</div>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-4 transition-all duration-500">
                <div className="text-2xl font-bold text-foreground">
                  {displayedOccupancy !== null ? `${displayedOccupancy.toFixed(1)}%` : "–"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Live occupancy</div>
              </div>
              <div className="col-span-2 bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Booking velocity</span>
                  <span className="ml-auto text-xs font-bold text-green-400">{displayedVelocity}/hr</span>
                </div>
                <OccupancyBar percent={Math.min(displayedVelocity * 5, 100)} />
              </div>
            </div>
          </div>

          {/* Live booking feed */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-glow" />
              <span className="text-sm font-semibold">Live Booking Activity</span>
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Real-time
              </span>
            </div>
            {pulseLoading && mergedBookings.length === 0 ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />)}
              </div>
            ) : (
              <PulseFeed bookings={mergedBookings} />
            )}
          </div>
        </div>
      </section>

      {/* Filling Fast */}
      {fillingFast.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">Filling Fast</h2>
            <span className="text-xs text-muted-foreground">Book before they're gone</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fillingFast.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        </section>
      )}

      {/* Featured Offers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Featured Offers</h2>
          <Link href="/offers" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allFeatured.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-card-border p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to find your next deal?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Explore all active offers with live availability — across fitness, beauty, dining, healthcare and sports.</p>
            <Link href="/offers">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all">
                Browse All Offers <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
