import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { MenuOrderProvider } from "./contexts/MenuOrderContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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
      <LanguageProvider>
        <ThemeProvider>
        <MenuOrderProvider>
        <BrowserRouter>
          <NotificationProvider>
            <PresenceProvider>
            <TooltipProvider>
            <UserProfileModalProvider>
            <InboxProvider>
              <Toaster />
              <Sonner position="top-right" richColors />
              <Routes>
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
            </InboxProvider>
            </UserProfileModalProvider>
            </TooltipProvider>
            </PresenceProvider>
          </NotificationProvider>
        </BrowserRouter>
        </MenuOrderProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
