import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListSlots, useGetOffer, useCreateSlot, useUpdateSlot, useDeleteSlot, getListSlotsQueryKey, getGetOfferQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronLeft, X, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const slotSchema = z.object({
  slotDate: z.string().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  capacity: z.coerce.number().min(1, "Must be at least 1"),
});
type SlotForm = z.infer<typeof slotSchema>;

const STATUS_COLORS: Record<string, string> = {
  Available: "text-green-400 bg-green-400/10 border-green-400/20",
  Full: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Closed: "text-muted-foreground bg-muted/30 border-border",
  Expired: "text-muted-foreground bg-muted/20 border-border",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

function SlotModal({ open, onClose, offerId }: { open: boolean; onClose: () => void; offerId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createSlot = useCreateSlot();
  const form = useForm<SlotForm>({
    resolver: zodResolver(slotSchema),
    defaultValues: { slotDate: "", startTime: "", endTime: "", capacity: 10 },
  });

  const onSubmit = (data: SlotForm) => {
    createSlot.mutate({ offerId, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSlotsQueryKey(offerId) });
        onClose();
        toast({ title: "Slot created" });
        form.reset();
      },
      onError: () => toast({ title: "Failed to create slot", variant: "destructive" }),
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-card-border rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Slot</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Date *</label>
            <input type="date" {...form.register("slotDate")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            {form.formState.errors.slotDate && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.slotDate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Time *</label>
              <input type="time" {...form.register("startTime")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End Time *</label>
              <input type="time" {...form.register("endTime")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Capacity *</label>
            <input type="number" {...form.register("capacity")} min="1" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            {form.formState.errors.capacity && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.capacity.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground">Cancel</button>
            <button type="submit" disabled={createSlot.isPending} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createSlot.isPending ? "Creating..." : "Create Slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminOfferSlots() {
  const [, params] = useRoute("/admin/offers/:id/slots");
  const offerId = Number(params?.id);
  const { data: offer } = useGetOffer(offerId, { query: { enabled: !!offerId, queryKey: getGetOfferQueryKey(offerId) } });
  const { data: slots, isLoading } = useListSlots(offerId, { query: { enabled: !!offerId, queryKey: getListSlotsQueryKey(offerId) } });
  const deleteSlot = useDeleteSlot();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = (slotId: number) => {
    if (!confirm("Delete this slot?")) return;
    deleteSlot.mutate({ id: slotId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSlotsQueryKey(offerId) }); toast({ title: "Slot deleted" }); },
      onError: () => toast({ title: "Failed to delete slot", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/offers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to offers
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{(offer as any)?.title ?? "Offer Slots"}</h1>
              <p className="text-sm text-muted-foreground">{slots?.length ?? 0} slots configured</p>
            </div>
            <button
              data-testid="button-new-slot"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : !slots?.length ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No slots yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add time slots for customers to book</p>
            <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1.5" /> Add Slot
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot: any) => {
              const occupancyPct = slot.occupancyPercent ?? 0;
              const barColor = occupancyPct >= 90 ? "bg-red-500" : occupancyPct >= 70 ? "bg-orange-500" : occupancyPct >= 40 ? "bg-yellow-500" : "bg-green-500";
              return (
                <div key={slot.id} data-testid={`slot-card-${slot.id}`} className="bg-card border border-card-border rounded-xl p-4 group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_COLORS[slot.status] ?? STATUS_COLORS.Available)}>
                      {slot.status}
                    </span>
                    <button onClick={() => handleDelete(slot.id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {slot.startTime} – {slot.endTime}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{slot.slotDate}</div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(occupancyPct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{slot.bookedCount}/{slot.capacity}</span>
                    <span>{occupancyPct}% full</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SlotModal open={modalOpen} onClose={() => setModalOpen(false)} offerId={offerId} />
    </AdminLayout>
  );
}
