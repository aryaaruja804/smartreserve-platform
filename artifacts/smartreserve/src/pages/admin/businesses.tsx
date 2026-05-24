import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListBusinesses, useCreateBusiness, useUpdateBusiness, useDeleteBusiness, getListBusinessesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BUSINESS_TYPES = ["Gym", "Salon", "Restaurant", "Clinic", "Turf", "Coaching", "Other"];

const bizSchema = z.object({
  name: z.string().min(2, "Required"),
  businessType: z.string().min(1, "Required"),
  ownerName: z.string().min(2, "Required"),
  phone: z.string().regex(/^\d{10}$/, "10 digits required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(3, "Required"),
  city: z.string().min(2, "Required"),
  openingTime: z.string().min(1, "Required"),
  closingTime: z.string().min(1, "Required"),
});
type BizForm = z.infer<typeof bizSchema>;

function BusinessModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: any }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const createBiz = useCreateBusiness();
  const updateBiz = useUpdateBusiness();

  const form = useForm<BizForm>({
    resolver: zodResolver(bizSchema),
    defaultValues: editing ?? { name: "", businessType: "Gym", ownerName: "", phone: "", email: "", address: "", city: "", openingTime: "09:00", closingTime: "21:00" },
  });

  const onSubmit = (data: BizForm) => {
    const invalidate = () => qc.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
    if (editing) {
      updateBiz.mutate({ id: editing.id, data }, {
        onSuccess: () => { invalidate(); onClose(); toast({ title: "Business updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createBiz.mutate({ data }, {
        onSuccess: () => { invalidate(); onClose(); toast({ title: "Business created" }); form.reset(); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-card-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{editing ? "Edit Business" : "New Business"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-3">
          {[
            { name: "name" as const, label: "Business Name", placeholder: "Iron Peak Fitness" },
            { name: "ownerName" as const, label: "Owner Name", placeholder: "John Doe" },
            { name: "phone" as const, label: "Phone (10 digits)", placeholder: "9876543210" },
            { name: "email" as const, label: "Email", placeholder: "contact@business.com" },
            { name: "address" as const, label: "Address", placeholder: "123 Main Street" },
            { name: "city" as const, label: "City", placeholder: "Bangalore" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="text-xs font-medium text-muted-foreground block mb-1">{label} *</label>
              <input {...form.register(name)} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              {form.formState.errors[name] && <p className="text-xs text-destructive mt-0.5">{form.formState.errors[name]?.message}</p>}
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Business Type *</label>
            <select {...form.register("businessType")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Opening Time *</label>
              <input type="time" {...form.register("openingTime")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Closing Time *</label>
              <input type="time" {...form.register("closingTime")} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={createBiz.isPending || updateBiz.isPending} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createBiz.isPending || updateBiz.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TYPE_EMOJI: Record<string, string> = { Gym: "🏋️", Salon: "💇", Restaurant: "🍽️", Clinic: "🏥", Turf: "⚽", Coaching: "📚", Other: "🏢" };

export default function AdminBusinesses() {
  const { data: businesses, isLoading } = useListBusinesses();
  const deleteBiz = useDeleteBusiness();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this business? All offers and slots will be removed.")) return;
    deleteBiz.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListBusinessesQueryKey() }); toast({ title: "Business deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Businesses</h1>
            <p className="text-sm text-muted-foreground">{businesses?.length ?? 0} registered</p>
          </div>
          <button
            data-testid="button-new-business"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> New Business
          </button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : !businesses?.length ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No businesses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first business to start adding offers</p>
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1.5" /> Add Business
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {businesses.map((biz: any) => (
              <div key={biz.id} data-testid={`card-business-${biz.id}`} className="bg-card border border-card-border rounded-xl p-5 group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                    {TYPE_EMOJI[biz.businessType] ?? "🏢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug">{biz.name}</h3>
                    <p className="text-xs text-muted-foreground">{biz.businessType} · {biz.city}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(biz); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(biz.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>{biz.ownerName} · {biz.phone}</div>
                  <div className="truncate">{biz.address}</div>
                  <div>{biz.openingTime} – {biz.closingTime}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BusinessModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </AdminLayout>
  );
}
