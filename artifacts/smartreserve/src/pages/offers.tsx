import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListPublicOffers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Search, Filter, Flame, TrendingUp, Star, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Fitness", "Beauty", "Dining", "Healthcare", "Sports", "Other"];
const CITIES = ["All", "Bangalore", "Mumbai", "Pune", "Chennai", "Hyderabad", "Delhi"];

function OccupancyBar({ percent }: { percent: number }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : percent >= 40 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

export default function Offers() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");

  const { data: offers, isLoading } = useListPublicOffers({
    search: search || undefined,
    category: category !== "All" ? category : undefined,
    city: city !== "All" ? city : undefined,
  }, { query: { refetchInterval: 30000 } });

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">All Offers</h1>
          <p className="text-muted-foreground text-sm">{offers?.length ?? 0} active offers with real-time availability</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search offers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                data-testid={`filter-category-${cat}`}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs border transition-all",
                  city === c
                    ? "bg-secondary text-foreground border-primary/30"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Offers grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : !offers?.length ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold mb-1">No offers found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map((offer: any) => {
              const savings = offer.originalPrice - offer.offerPrice;
              return (
                <Link key={offer.id} href={`/offers/${offer.id}`}>
                  <div
                    data-testid={`card-offer-${offer.id}`}
                    className="group bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                      <span className="text-5xl opacity-20">
                        {offer.business?.businessType === "Gym" ? "🏋️" :
                         offer.business?.businessType === "Salon" ? "💇" :
                         offer.business?.businessType === "Restaurant" ? "🍽️" :
                         offer.business?.businessType === "Clinic" ? "🏥" :
                         offer.business?.businessType === "Turf" ? "⚽" : "🏢"}
                      </span>
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        {offer.isFillingFast && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            <Flame className="w-3 h-3" /> Filling Fast
                          </span>
                        )}
                        {offer.isTrending && !offer.isFillingFast && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <TrendingUp className="w-3 h-3" /> Trending
                          </span>
                        )}
                        {!offer.isFillingFast && !offer.isTrending && offer.demandLevel === "Low" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            <Star className="w-3 h-3" /> Best Availability
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold">
                        {Math.round(offer.discountPercent)}% OFF
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{offer.business?.name} · {offer.business?.city}</p>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{offer.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{offer.description}</p>

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-xl font-bold">₹{offer.offerPrice.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground line-through">₹{offer.originalPrice.toLocaleString()}</span>
                        <span className="text-xs text-green-400 font-medium ml-auto">Save ₹{savings.toLocaleString()}</span>
                      </div>

                      <OccupancyBar percent={offer.occupancyPercent} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {offer.availableSlots} slots</span>
                        {offer.recentBookings > 0 && (
                          <span className="text-blue-400">{offer.recentBookings} booked recently</span>
                        )}
                        {offer.recommendedSlotTime && (
                          <span className="flex items-center gap-1 text-primary"><Star className="w-3 h-3" /> Rec: {offer.recommendedSlotTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
