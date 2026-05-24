import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetDashboardStats, useGetDashboardActivity, useGetDemandAnalytics, useGetTopOffers } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Tag, CalendarCheck, DollarSign, Activity, Users, Zap, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const CHART_COLORS = ["hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(280 68% 60%)", "hsl(0 72% 51%)", "hsl(193 80% 50%)"];

function StatCard({ label, value, sub, icon: Icon, trend }: { label: string; value: string | number; sub?: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className="text-xs text-green-400 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight mb-0.5 count-up">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function OccupancyBar({ percent }: { percent: number }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-orange-500" : percent >= 40 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">{percent}%</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { refetchInterval: 15000 } });
  const { data: activity, isLoading: actLoading } = useGetDashboardActivity({ limit: 15 }, { query: { refetchInterval: 10000 } });
  const { data: analytics } = useGetDemandAnalytics({ query: { refetchInterval: 30000 } });
  const { data: topOffers } = useGetTopOffers({ query: { refetchInterval: 30000 } });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time operational overview</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-glow" />
            Live
          </div>
        </div>

        {/* Stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Offers" value={stats?.totalOffers ?? 0} icon={Tag} sub={`${stats?.activeOffers ?? 0} active`} />
            <StatCard label="Total Bookings" value={stats?.totalBookings ?? 0} icon={CalendarCheck} sub={`${stats?.todayBookings ?? 0} today`} trend={`+${stats?.todayBookings ?? 0}`} />
            <StatCard label="Revenue" value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={DollarSign} sub="All confirmed bookings" />
            <StatCard label="Occupancy Rate" value={`${stats?.occupancyRate ?? 0}%`} icon={Users} sub="Avg across all slots" />
            <StatCard label="Active Offers" value={stats?.activeOffers ?? 0} icon={Zap} sub="Currently bookable" />
            <StatCard label="Capacity Util." value={`${stats?.capacityUtilization ?? 0}%`} icon={Activity} sub="Seats filled" />
            <StatCard label="Today Bookings" value={stats?.todayBookings ?? 0} icon={TrendingUp} sub="Since midnight" trend={`+${stats?.todayBookings ?? 0}`} />
            <StatCard label="Open Slots" value={stats?.pendingSlots ?? 0} icon={CalendarCheck} sub="Available to book" />
          </div>
        )}

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Hourly booking chart */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Booking Activity (Last 7 days by hour)</h3>
            {analytics?.hourlyBookings ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.hourlyBookings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(213 31% 91%)" }}
                    formatter={(v) => [v, "Bookings"]}
                    labelFormatter={h => `Hour ${h}:00`}
                  />
                  <Bar dataKey="count" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 bg-muted/30 rounded-lg animate-pulse" />
            )}
            {analytics && <p className="text-xs text-muted-foreground mt-2">Peak hour: {analytics.peakHour}:00 · Conversion rate: {analytics.conversionRate}%</p>}
          </div>

          {/* Offers by category pie */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Offers by Category</h3>
            {stats?.offersByCategory?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.offersByCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {stats.offersByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222 47% 7%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 bg-muted/30 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* Activity + Top Offers */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Live activity feed */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-glow" />
              <h3 className="font-semibold text-sm">Live Booking Feed</h3>
            </div>
            {actLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : !activity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {activity.map((item: any) => (
                  <div key={item.id} data-testid={`activity-${item.id}`} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{item.customerName}</span>
                        <span className="text-muted-foreground"> booked </span>
                        <span className="text-primary font-medium truncate">{item.offerTitle}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.businessName} · {item.bookingReference}</div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top offers */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Top Performing Offers</h3>
            {!topOffers?.length ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {topOffers.slice(0, 6).map((offer: any, i: number) => (
                  <div key={offer.id} data-testid={`top-offer-${offer.id}`} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 flex-shrink-0 font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{offer.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <OccupancyBar percent={offer.occupancyPercent} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold">{offer.totalBookings} bookings</div>
                      <div className="text-xs text-green-400">₹{offer.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Business type breakdown */}
        {analytics?.businessTypeBreakdown?.length > 0 && (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Business Type Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {analytics.businessTypeBreakdown.map((bt: any, i: number) => (
                <div key={bt.businessType} className="bg-background rounded-lg p-3 text-center">
                  <div className="text-lg font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                    {bt.bookings}
                  </div>
                  <div className="text-xs font-medium mt-0.5">{bt.businessType}</div>
                  <div className="text-xs text-muted-foreground">{bt.offers} offers</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
