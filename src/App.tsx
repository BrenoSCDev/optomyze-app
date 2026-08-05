import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OptusProvider } from "@/contexts/OptusContext";
import { QuickstartProvider } from "@/contexts/QuickstartContext";
import PublicBooking from "./pages/PublicBooking";
import { CalendarsProvider } from "@/contexts/CalendarsContext";
import OptusBubble from "@/components/support/OptusBubble";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PresenceProvider } from "./contexts/PresenceContext";
import { UserProfileModalProvider } from "./contexts/UserProfileModalContext";
import { InboxProvider } from "./contexts/InboxContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PasswordReset from "./pages/PasswordReset";
import SetPassword from "./pages/SetPassword";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import FunnelStages from "./components/stages/FunnelStages";
import DealFunnel from "./pages/DealFunnel";
import Demo from "./pages/Demo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserPreferencesProvider>
      <LanguageProvider>
        <ThemeProvider>
        <BrowserRouter>
          <NotificationProvider>
            <PresenceProvider>
            <TooltipProvider>
            <UserProfileModalProvider>
            <InboxProvider>
            <OptusProvider>
            <QuickstartProvider>
            <CalendarsProvider>
              <Toaster />
              <Sonner position="top-right" richColors />
              <Routes>
                {/* Public booking page — no auth, no CRM chrome. Placed
                    before the protected routes so nothing wraps it. */}
                <Route path="/book/:slug" element={<PublicBooking />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/set-password" element={<SetPassword />} />
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
                   path="/deals/:funnelId" 
                   element={
                     <ProtectedRoute>
                       <DealFunnel />
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
                 <Route path="/demo" element={<Demo />} />
                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Renders itself only when enabled in Preferences and the
                  user is signed in. */}
              <OptusBubble />
            </CalendarsProvider>
            </QuickstartProvider>
            </OptusProvider>
            </InboxProvider>
            </UserProfileModalProvider>
            </TooltipProvider>
            </PresenceProvider>
          </NotificationProvider>
        </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
      </UserPreferencesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
