import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetPublicOffer, useCreateBooking, getGetPublicOfferQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, TrendingUp, Star, Users, Clock, Building2, MapPin, CheckCircle2, ChevronLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  peopleCount: z.coerce.number().min(1, "At least 1 person required"),
  specialNote: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

function OccupancyBar({ percent }: { percent: number }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : percent >= 40 ? "bg-yellow-500" : "bg-green-500";
  const label = percent >= 90 ? "Almost Full" : percent >= 70 ? "Filling Fast" : percent >= 40 ? "Moderate" : "Available";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>{label}</span>
        <span>{percent}% full</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

export default function OfferDetail() {
  const [, params] = useRoute("/offers/:id");
  const id = Number(params?.id);
  const { data: offer, isLoading } = useGetPublicOffer(id, { query: { enabled: !!id, queryKey: getGetPublicOfferQueryKey(id) } });
  const createBooking = useCreateBooking();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", peopleCount: 1, specialNote: "" },
  });

  const onSubmit = (data: BookingForm) => {
    if (!selectedSlotId) {
      toast({ title: "Please select a time slot", variant: "destructive" });
      return;
    }
    createBooking.mutate({
      data: {
        slotId: selectedSlotId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        peopleCount: data.peopleCount,
        specialNote: data.specialNote || undefined,
      }
    }, {
      onSuccess: (booking) => {
        setConfirmedBooking(booking);
        queryClient.invalidateQueries({ queryKey: getGetPublicOfferQueryKey(id) });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Booking failed. Please try again.";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  if (isLoading) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-8 w-32 rounded bg-muted/40 animate-pulse mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-52 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
          </div>
          <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    </PublicLayout>
  );

  if (!offer) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Offer not found</h2>
        <Link href="/offers" className="text-primary text-sm hover:underline">Back to offers</Link>
      </div>
    </PublicLayout>
  );

  if (confirmedBooking) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-8 text-sm">Your slot has been reserved successfully.</p>

          <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Booking Reference</div>
            <div className="font-mono text-3xl font-bold text-primary mb-4 tracking-widest">{confirmedBooking.bookingReference}</div>
            <div className="border-t border-border pt-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offer</span>
                <span className="font-medium text-right">{offer.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business</span>
                <span className="font-medium">{offer.business?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{confirmedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">People</span>
                <span className="font-medium">{confirmedBooking.peopleCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/offers">
              <button className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Browse More Offers
              </button>
            </Link>
            <button
              onClick={() => setConfirmedBooking(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back to Offer
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const demand = offer.demandInfo;
  const availableSlots = offer.slots?.filter((s: any) => s.status === "Available" && s.availableCount > 0) ?? [];
  const selectedSlot = offer.slots?.find((s: any) => s.id === selectedSlotId);

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/offers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to offers
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: offer info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="h-44 bg-gradient-to-br from-primary/20 to-accent relative flex items-center justify-center">
                <span className="text-8xl opacity-10">
                  {offer.business?.businessType === "Gym" ? "🏋️" :
                   offer.business?.businessType === "Salon" ? "💇" :
                   offer.business?.businessType === "Restaurant" ? "🍽️" :
                   offer.business?.businessType === "Clinic" ? "🏥" :
                   offer.business?.businessType === "Turf" ? "⚽" : "🏢"}
                </span>
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  {demand?.isFillingFast && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <Flame className="w-3 h-3" /> Filling Fast
                    </span>
                  )}
                  {demand?.isTrending && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <TrendingUp className="w-3 h-3" /> Trending
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold">
                  {Math.round(offer.discountPercent)}% OFF
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Building2 className="w-3.5 h-3.5" /> {offer.business?.name}
                  <span className="text-border">·</span>
                  <MapPin className="w-3.5 h-3.5" /> {offer.business?.city}
                </div>
                <h1 className="text-xl font-bold mb-2">{offer.title}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{offer.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-background rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Offer price</div>
                    <div className="font-bold text-lg">₹{offer.offerPrice.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground line-through">₹{offer.originalPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">You save</div>
                    <div className="font-bold text-lg text-green-400">₹{(offer.originalPrice - offer.offerPrice).toLocaleString()}</div>
                    <div className="text-xs text-green-400">{Math.round(offer.discountPercent)}% discount</div>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Demand</div>
                    <div className={cn("font-bold text-sm", demand?.demandLevel === "High" || demand?.demandLevel === "Critical" ? "text-orange-400" : demand?.demandLevel === "Medium" ? "text-yellow-400" : "text-green-400")}>
                      {demand?.demandLevel}
                    </div>
                    <div className="text-xs text-muted-foreground">{demand?.recentBookings} recent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demand info */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Live Demand Signal</h3>
              <OccupancyBar percent={demand?.occupancyPercent ?? 0} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {demand?.recentBookings > 0 && (
                  <div className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-2 rounded-lg border border-blue-400/20">
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">{demand.recentBookings} bookings in last 15 mins</span>
                  </div>
                )}
                {demand?.recommendedSlotTime && (
                  <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
                    <Star className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">Recommended: {demand.recommendedSlotTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Slot selection */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4">Select Time Slot</h3>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No available slots at this time</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSlots.map((slot: any) => {
                    const isRec = slot.id === demand?.recommendedSlotId;
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        data-testid={`slot-${slot.id}`}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={cn(
                          "text-left p-3.5 rounded-lg border transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : isRec
                            ? "border-green-500/40 bg-green-500/5 hover:border-green-400/60"
                            : "border-border hover:border-primary/30 bg-background"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{slot.startTime} – {slot.endTime}</span>
                          {isRec && <span className="ml-auto text-xs text-green-400 font-medium flex items-center gap-0.5"><Star className="w-3 h-3" /> Rec</span>}
                          {isSelected && <span className="ml-auto text-xs text-primary font-medium">Selected</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{slot.slotDate}</div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-1">
                          <div
                            className={cn("h-full rounded-full", slot.occupancyPercent >= 70 ? "bg-orange-500" : "bg-green-500")}
                            style={{ width: `${Math.min(slot.occupancyPercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {slot.availableCount} available</span>
                          <span>{slot.occupancyPercent}% full</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Terms */}
            {offer.terms && (
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-2">Terms & Conditions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{offer.terms}</p>
              </div>
            )}
          </div>

          {/* Right: booking form */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="font-semibold mb-4">Reserve Your Slot</h3>
                {selectedSlot ? (
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                    <div className="font-medium text-primary mb-0.5">Selected slot</div>
                    <div className="text-foreground">{selectedSlot.startTime} – {selectedSlot.endTime}</div>
                    <div className="text-muted-foreground">{selectedSlot.slotDate} · {selectedSlot.availableCount} spots left</div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                    Select a time slot from the list
                  </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name *</label>
                    <input
                      data-testid="input-customer-name"
                      {...form.register("customerName")}
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-xs text-destructive mt-0.5">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Phone Number *</label>
                    <input
                      data-testid="input-customer-phone"
                      {...form.register("customerPhone")}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {form.formState.errors.customerPhone && (
                      <p className="text-xs text-destructive mt-0.5">{form.formState.errors.customerPhone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Email (optional)</label>
                    <input
                      data-testid="input-customer-email"
                      {...form.register("customerEmail")}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Number of People *</label>
                    <input
                      data-testid="input-people-count"
                      {...form.register("peopleCount")}
                      type="number"
                      min="1"
                      placeholder="1"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {form.formState.errors.peopleCount && (
                      <p className="text-xs text-destructive mt-0.5">{form.formState.errors.peopleCount.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Special Note (optional)</label>
                    <textarea
                      {...form.register("specialNote")}
                      placeholder="Any requests..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>

                  {selectedSlot && (
                    <div className="pt-1 border-t border-border">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Offer price</span>
                        <span className="font-semibold">₹{offer.offerPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-400 mb-3">
                        <span>You save</span>
                        <span>₹{(offer.originalPrice - offer.offerPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid="button-submit-booking"
                    disabled={createBooking.isPending || !selectedSlotId}
                    className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
