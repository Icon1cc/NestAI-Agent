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
  const isMapPickerOpen = useAppStore((s) => s.isMapPickerOpen);
  const location = useAppStore((s) => s.location);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const [isContactOpen, setContactOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isTermsOpen, setTermsOpen] = useState(false);

  // Hide footer when in main app view (has location) to avoid overlap with panel
  const showFooter = !isMapPickerOpen && !location;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Global footer - only show on landing page */}
          {showFooter && (
            <footer className="fixed inset-x-0 bottom-0 z-40 p-4 pointer-events-none">
              <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                {/* Copyright */}
                <div className="order-2 sm:order-1 px-3 py-1.5 rounded-full bg-background/80 border border-border/60 text-xs text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-auto">
                  © {currentYear} NestAI Agent
                </div>

                {/* Links */}
                <div className="order-1 sm:order-2 px-4 py-1.5 rounded-full bg-background/80 border border-border/60 text-xs text-muted-foreground backdrop-blur-sm shadow-sm flex items-center gap-2 sm:gap-3 pointer-events-auto">
                  <button
                    onClick={() => setContactOpen(true)}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </button>
                  <span className="text-border hidden sm:inline">•</span>
                  <button
                    onClick={() => setAboutOpen(true)}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    About
                  </button>
                  <span className="text-border hidden sm:inline">•</span>
                  <button
                    onClick={() => setTermsOpen(true)}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Terms
                  </button>
                </div>
              </div>
            </footer>
          )}

          <Dialog open={isContactOpen} onOpenChange={setContactOpen}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Contact</DialogTitle>
                <DialogDescription>
                  Reach the NestAI team via email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <a
                  className="nest-chip-primary inline-flex items-center gap-2 flex-wrap"
                  href="mailto:rishtiwari98@gmail.com"
                >
                  <span className="font-semibold">Rishabh Tiwari</span>
                  <span className="text-muted-foreground text-xs">
                    rishtiwari98@gmail.com
                  </span>
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2 flex-wrap"
                  href="mailto:alexandre.boving@gmail.com"
                >
                  <span className="font-semibold">Alexandre Boving</span>
                  <span className="text-muted-foreground text-xs">
                    alexandre.boving@gmail.com
                  </span>
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2 flex-wrap"
                  href="mailto:hello@quentinrobert.com"
                >
                  <span className="font-semibold">Quentin Robert</span>
                  <span className="text-muted-foreground text-xs">
                    hello@quentinrobert.com
                  </span>
                </a>
                <a
                  className="nest-chip inline-flex items-center gap-2 flex-wrap"
                  href="mailto:vladimirsachkov2003@gmail.com"
                >
                  <span className="font-semibold">Vladimir Sachkov</span>
                  <span className="text-muted-foreground text-xs">
                    vladimirsachkov2003@gmail.com
                  </span>
                </a>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAboutOpen} onOpenChange={setAboutOpen}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>About us</DialogTitle>
                <DialogDescription>
                  Learn about the team and mission.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  NestAI helps anyone find the right home faster: we pair live
                  listings with an AI copilot that understands your needs,
                  weighs trade‑offs, and keeps the conversation going so you
                  don't lose context.
                </p>
                <p>
                  Under the hood, we combine real-time property feeds,
                  neighborhood data (transit, parks, schools, safety), and your
                  personal constraints to surface matches, not just results.
                </p>
                <p>
                  Our team blends product, data, and real-estate experience to
                  deliver a calm, transparent search experience for renters and
                  buyers alike.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTermsOpen} onOpenChange={setTermsOpen}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
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
