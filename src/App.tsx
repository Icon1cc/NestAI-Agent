import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAppStore } from "./store/appStore";

const queryClient = new QueryClient();

const App = () => {
  const currentYear = new Date().getFullYear();
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        <div className="fixed left-4 bottom-4 z-40 px-3 py-1.5 rounded-full bg-background/80 border border-border/60 text-xs text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-none">
          © {currentYear} NestAI Agent
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
