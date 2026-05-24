import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { useLocation } from "wouter";
import { useEffect } from "react";

import Home from "@/pages/home";
import Offers from "@/pages/offers";
import OfferDetail from "@/pages/offer-detail";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBusinesses from "@/pages/admin/businesses";
import AdminOffers from "@/pages/admin/offers";
import AdminOfferSlots from "@/pages/admin/offer-slots";
import AdminBookings from "@/pages/admin/bookings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, setLocation]);
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/offers" component={Offers} />
      <Route path="/offers/:id" component={OfferDetail} />

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminGuard><AdminDashboard /></AdminGuard>
      </Route>
      <Route path="/admin/businesses">
        <AdminGuard><AdminBusinesses /></AdminGuard>
      </Route>
      <Route path="/admin/offers">
        <AdminGuard><AdminOffers /></AdminGuard>
      </Route>
      <Route path="/admin/offers/:id/slots">
        <AdminGuard><AdminOfferSlots /></AdminGuard>
      </Route>
      <Route path="/admin/bookings">
        <AdminGuard><AdminBookings /></AdminGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
