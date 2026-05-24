import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Zap, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const { setToken, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  useEffect(() => {
    if (isAuthenticated) setLocation("/admin");
  }, [isAuthenticated, setLocation]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@smartreserve.com", password: "password123" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setToken(res.token);
        setLocation("/admin");
      },
      onError: () => {
        form.setError("password", { message: "Invalid email or password" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/8 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartReserve</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin Control Center</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-xl">
          <h2 className="font-semibold mb-5 text-sm">Sign in to continue</h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  data-testid="input-email"
                  {...form.register("email")}
                  type="email"
                  placeholder="admin@smartreserve.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  data-testid="input-password"
                  {...form.register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              data-testid="button-login"
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 mt-2"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">Demo credentials pre-filled above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
