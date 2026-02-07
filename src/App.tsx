import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isContactOpen, setContactOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isTermsOpen, setTermsOpen] = useState(false);

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

          {/* Global footer actions (inside Router so Links work) */}
          <div className="fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-3 px-4">
            <div className="px-4 py-1.5 rounded-full bg-background/80 border border-border/60 text-xs text-muted-foreground backdrop-blur-sm shadow-sm flex items-center gap-3">
              <button
                onClick={() => setContactOpen(true)}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Contact
              </button>
              <span className="text-border">•</span>
              <button
                onClick={() => setAboutOpen(true)}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                About us
              </button>
              <span className="text-border">•</span>
              <button
                onClick={() => setTermsOpen(true)}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Terms and conditions
              </button>
            </div>
          </div>

          <div className="fixed left-4 bottom-4 z-40 px-3 py-1.5 rounded-full bg-background/80 border border-border/60 text-xs text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-none">
            © {currentYear} NestAI Agent
          </div>

          <Dialog open={isContactOpen} onOpenChange={setContactOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Contact</DialogTitle>
                <DialogDescription>
                  Reach the NestAI team via email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <a
                  className="nest-chip-primary inline-flex items-center gap-2"
                  href="mailto:rishtiwari98@gmail.com"
                >
                  rishtiwari98@gmail.com
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2"
                  href="mailto:alexandre.boving@gmail.com"
                >
                  alexandre.boving@gmail.com
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2"
                  href="mailto:hello@quentinrobert.com"
                >
                  hello@quentinrobert.com
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2"
                  href="mailto:vladimirsachkov2003@gmail.com"
                >
                  vladimirsachkov2003@gmail.com
                </a>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAboutOpen} onOpenChange={setAboutOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>About us</DialogTitle>
                <DialogDescription>
                  Learn about the team and mission.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We build NestAI Agent to simplify finding great neighborhoods
                  and homes with data-driven insights.
                </p>
                <p>
                  Our team blends product, data, and real-estate experience to
                  deliver a calm, map-first search.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTermsOpen} onOpenChange={setTermsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Terms and conditions</DialogTitle>
                <DialogDescription>
                  Key points you should know.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Information is provided for guidance only—verify critical
                  details with providers.
                </p>
                <p>
                  Use the app responsibly and follow applicable laws. Do not
                  share sensitive personal data.
                </p>
                <p>
                  We may update terms; continued use means acceptance of the
                  latest version.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
