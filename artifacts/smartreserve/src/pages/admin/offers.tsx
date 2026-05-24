import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListOffers, useListBusinesses, useCreateOffer, useUpdateOffer, useDeleteOffer, useUpdateOfferStatus, getListOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Tag, X, Pause, Play, Calendar } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  Active: "text-green-400 bg-green-400/10 border-green-400/20",
  Draft: "text-muted-foreground bg-muted/50 border-border",
  Paused: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Expired: "text-muted-foreground bg-muted/30 border-border",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

const offerSchema = z.object({
  businessId: z.coerce.number().min(1, "Select a business"),
  title: z.string().min(3, "Required"),
  description: z.string().min(10, "Required"),
  category: z.string().min(1, "Required"),
  originalPrice: z.coerce.number().min(1, "Must be > 0"),
  offerPrice: z.coerce.number().min(1, "Must be > 0"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  terms: z.string().optional(),
  status: z.string().default("Draft"),
}).refine(d => d.offerPrice < d.originalPrice, { message: "Offer price must be less than original", path: ["offerPrice"] });

type OfferForm = z.infer<typeof offerSchema>;
const CATEGORIES = ["Fitness", "Beauty", "Dining", "Healthcare", "Sports", "Education", "Entertainment", "Other"];

function OfferModal({ open, onClose, editing, businesses }: { open: boolean; onClose: () => void; editing?: any; businesses: any[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();

  const form = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
    defaultValues: editing ? {
      ...editing,
      businessId: editing.businessId,
      originalPrice: editing.originalPrice,
      offerPrice: editing.offerPrice,
    } : { businessId: 0, title: "", description: "", category: "Fitness", originalPrice: 0, offerPrice: 0, startDate: "", endDate: "", startTime: "", endTime: "", terms: "", status: "Draft" },
  });

  const origPrice = form.watch("originalPrice");
  const offPrice = form.watch("offerPrice");
  const discount = origPrice > 0 && offPrice > 0 ? Math.round(((origPrice - offPrice) / origPrice) * 100) : 0;

  const onSubmit = (data: OfferForm) => {
    const invalidate = () => qc.invalidateQueries({ queryKey: getListOffersQueryKey() });
    if (editing) {
      updateOffer.mutate({ id: editing.id, data }, {
        onSuccess: () => { invalidate(); onClose(); toast({ title: "Offer updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createOffer.mutate({ data }, {
        onSuccess: () => { invalidate(); onClose(); toast({ title: "Offer created" }); form.reset(); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-card-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-semibold">{editing ? "Edit Offer" : "New Offer"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Business *</label>
            <select {...form.register("businessId")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value={0}>Select business</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {form.formState.errors.businessId && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.businessId.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Title *</label>
            <input {...form.register("title")} placeholder="Morning Fitness Bootcamp" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            {form.formState.errors.title && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Description *</label>
            <textarea {...form.register("description")} rows={2} placeholder="Describe the offer..." className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            {form.formState.errors.description && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category *</label>
              <select {...form.register("category")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
              <select {...form.register("status")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {["Draft", "Active", "Paused", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Original Price ₹ *</label>
              <input type="number" {...form.register("originalPrice")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              {form.formState.errors.originalPrice && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.originalPrice.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Offer Price ₹ *</label>
              <input type="number" {...form.register("offerPrice")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              {form.formState.errors.offerPrice && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.offerPrice.message}</p>}
            </div>
            <div className="text-center pb-1">
              <div className="text-lg font-bold text-green-400">{discount}%</div>
              <div className="text-xs text-muted-foreground">discount</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date *</label>
              <input type="date" {...form.register("startDate")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End Date *</label>
              <input type="date" {...form.register("endDate")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
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
            <label className="text-xs font-medium text-muted-foreground block mb-1">Terms & Conditions</label>
            <textarea {...form.register("terms")} rows={2} placeholder="Applicable terms..." className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={createOffer.isPending || updateOffer.isPending} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createOffer.isPending || updateOffer.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminOffers() {
  const { data: offers, isLoading } = useListOffers();
  const { data: businesses } = useListBusinesses();
  const deleteOffer = useDeleteOffer();
  const updateStatus = useUpdateOfferStatus();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this offer?")) return;
    deleteOffer.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListOffersQueryKey() }); toast({ title: "Offer deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleStatus = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListOffersQueryKey() }); toast({ title: `Offer ${status.toLowerCase()}` }); },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Offers</h1>
            <p className="text-sm text-muted-foreground">{offers?.length ?? 0} total offers</p>
          </div>
          <button
            data-testid="button-new-offer"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Offer
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : !offers?.length ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No offers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create offers for your businesses</p>
            <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1.5" /> New Offer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer: any) => (
              <div key={offer.id} data-testid={`card-offer-${offer.id}`} className="bg-card border border-card-border rounded-xl p-4 group flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{offer.title}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0", STATUS_COLORS[offer.status] ?? STATUS_COLORS.Draft)}>
                      {offer.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {offer.category} · ₹{offer.offerPrice} <span className="line-through opacity-60">₹{offer.originalPrice}</span> · {Math.round(offer.discountPercent)}% off
                  </div>
                  <div className="text-xs text-muted-foreground">{offer.startDate} → {offer.endDate}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Link href={`/admin/offers/${offer.id}/slots`}>
                    <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground" title="Manage slots">
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                  {offer.status === "Active" ? (
                    <button onClick={() => handleStatus(offer.id, "Paused")} className="p-1.5 rounded-lg hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-400" title="Pause">
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  ) : offer.status === "Paused" || offer.status === "Draft" ? (
                    <button onClick={() => handleStatus(offer.id, "Active")} className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400" title="Activate">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                  <button onClick={() => { setEditing(offer); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(offer.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <OfferModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} businesses={businesses ?? []} />
    </AdminLayout>
  );
}
