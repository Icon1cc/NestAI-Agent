import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Sparkles, Loader2, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';

const QUICK_CHIPS = [
  { label: 'Quieter', prompt: 'I prefer a quieter neighborhood' },
  { label: 'More parks', prompt: 'I want to be near parks and green spaces' },
  { label: 'Cheaper', prompt: 'Show me more affordable options' },
  { label: 'Near transit', prompt: 'I need good public transit access' },
  { label: 'Safer', prompt: 'Safety is a priority for me' },
  { label: 'Nightlife', prompt: 'I want to be near restaurants and bars' },
];

interface ChatBarProps {
  onSend: (message: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  hasLocation: boolean;
}

export function ChatBar({ onSend, onSearch, isLoading, hasLocation }: ChatBarProps) {
  const [input, setInput] = useState('');
  const { 
    isListening, 
    isSpeaking, 
    transcript, 
    isSupported,
    startListening, 
    stopListening,
    stopSpeaking,
    clearTranscript,
  } = useVoice();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim() || transcript.trim();
    if (message) {
      onSend(message);
      setInput('');
      clearTranscript();
    }
  };

  const handleChipClick = (prompt: string) => {
    onSend(prompt);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Sync transcript to input
  const displayValue = isListening ? transcript : input;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full px-4 pb-4 pt-2"
    >
      {/* Quick chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChipClick(chip.prompt)}
            disabled={!hasLocation || isLoading}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "bg-muted/50 text-muted-foreground border border-border/50",
              "hover:bg-muted hover:text-foreground hover:border-border",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Voice indicator */}
        {isListening && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
          >
            Listening...
          </motion.div>
        )}

        {/* Mic button */}
        {isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!hasLocation}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              isListening 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
              "disabled:opacity-50"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasLocation ? "Ask about the area or your search..." : "Select a location first"}
            disabled={!hasLocation || isLoading}
            className="nest-input w-full pr-12"
          />
          
          {/* Stop speaking button */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                type="button"
                onClick={stopSpeaking}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              >
                <VolumeX className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!hasLocation || isLoading || (!input.trim() && !transcript.trim())}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>

        {/* Search button */}
        <button
          type="button"
          onClick={onSearch}
          disabled={!hasLocation || isLoading}
          className="nest-btn-hero flex-shrink-0 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Search Listings</span>
        </button>
      </form>
    </motion.div>
  );
}
