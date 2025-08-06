import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth.tsx";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Market from "@/pages/market";
import Procurement from "@/pages/procurement";
import Inventory from "@/pages/inventory";
import Finance from "@/pages/finance";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/market" component={Market} />
      <ProtectedRoute path="/procurement" component={Procurement} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/finance" component={Finance} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
