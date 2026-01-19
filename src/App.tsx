import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { WhatsAppProvider } from "./contexts/WhatsAppContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import FunnelStages from "./components/stages/FunnelStages";
import LeadDetail from "./pages/LeadDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <NotificationProvider>
            <WhatsAppProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner position="top-right" richColors />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads/:funnelId" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/funnels/:funnelId/stages" 
                  element={
                    <ProtectedRoute>
                      <FunnelStages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/tags" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                   } 
                 />
                 <Route 
                   path="/ai-agents/n8n" 
                   element={
                     <ProtectedRoute>
                       <Index />
                     </ProtectedRoute>
                   } 
                  />
                 <Route 
                   path="/profile" 
                   element={
                     <ProtectedRoute>
                       <Profile />
                     </ProtectedRoute>
                   } 
                 />
                 <Route 
                   path="/leads/:funnelId/lead/:leadId" 
                   element={
                     <ProtectedRoute>
                       <LeadDetail />
                     </ProtectedRoute>
                   } 
                 />
                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </TooltipProvider>
            </WhatsAppProvider>
          </NotificationProvider>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
