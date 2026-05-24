import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListBookings } from "@workspace/api-client-react";
import { Search, CalendarCheck, Users, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "text-green-400 bg-green-400/10 border-green-400/20",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  Pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export default function AdminBookings() {
  const { data: bookings, isLoading } = useListBookings();
  const [search, setSearch] = useState("");

  const filtered = bookings?.filter((b: any) =>
    !search ||
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.customerPhone?.includes(search) ||
    b.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
    b.offer?.title?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Bookings</h1>
            <p className="text-sm text-muted-foreground">{bookings?.length ?? 0} total bookings</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-search-bookings"
              type="search"
              placeholder="Search by name, phone, ref..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">{search ? "No bookings found" : "No bookings yet"}</h3>
            <p className="text-sm text-muted-foreground">{search ? "Try different search terms" : "Bookings will appear here as customers reserve slots"}</p>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Offer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Slot</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">People</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking: any) => (
                    <tr
                      key={booking.id}
                      data-testid={`row-booking-${booking.id}`}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-primary">{booking.bookingReference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {booking.customerPhone}
                        </div>
                        {booking.customerEmail && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {booking.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[180px] truncate font-medium text-sm">{booking.offer?.title ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">₹{booking.offer?.offerPrice?.toLocaleString() ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {booking.slot ? (
                          <>
                            <div>{booking.slot.slotDate}</div>
                            <div>{booking.slot.startTime} – {booking.slot.endTime}</div>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {booking.peopleCount}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_COLORS[booking.status] ?? STATUS_COLORS.Confirmed)}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
