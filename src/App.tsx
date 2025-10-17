import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Partners from "./pages/Partners";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CompanyDashboard from "./pages/CompanyDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AddEditProperty from "./pages/AddEditProperty";
import AdminDashboard from "./pages/AdminDashboard";
import PropertyReview from "./pages/PropertyReview";
import NotFound from "./pages/NotFound";
import EditProfile from "./pages/EditProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/partners" replace />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/company" element={<CompanyDashboard />} />
          <Route path="/dashboard/company/add" element={<AddEditProperty />} />
          <Route path="/dashboard/company/edit/:id" element={<AddEditProperty />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/review/:id" element={<PropertyReview />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
