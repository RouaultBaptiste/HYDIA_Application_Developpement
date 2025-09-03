import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Passwords from "./pages/Passwords";
import Documents from "./pages/Documents";
import Notes from "./pages/Notes";
import Sharing from "./pages/Sharing";
import Users from "./pages/admin/Users";
import Audit from "./pages/admin/Audit";
import Infrastructure from "./pages/admin/Infrastructure";
import Policies from "./pages/admin/Policies";
import Settings from "./pages/admin/Settings";
import DsiDashboard from "./pages/admin/DsiDashboard";
import Formations from "./pages/Formations";
import AdminFormations from "./pages/admin/Formations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes avec Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="passwords" element={<Passwords />} />
              <Route path="documents" element={<Documents />} />
              <Route path="notes" element={<Notes />} />
              <Route path="sharing" element={<Sharing />} />
              <Route path="formations" element={<Formations />} />
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/audit" element={<Audit />} />
              <Route path="admin/infrastructure" element={<Infrastructure />} />
              <Route path="admin/policies" element={<Policies />} />
              <Route path="admin/settings" element={<Settings />} />
              <Route path="admin/dashboard" element={<DsiDashboard />} />
              <Route path="admin/formations" element={<AdminFormations />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
