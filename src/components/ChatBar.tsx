import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Sparkles, Loader2, MicOff, VolumeX, Home } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useAppStore } from '@/store/appStore';
import { BUDGET_CHIPS } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ChatBarProps {
  onSend: (message: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  hasLocation: boolean;
  hasBudget?: boolean;
}

export function ChatBar({ onSend, onSearch, isLoading, hasLocation, hasBudget = false }: ChatBarProps) {
  const [input, setInput] = useState('');
  const { priceMax, setPriceRange, addMessage } = useAppStore();
  const t = useI18n();
  
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

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (message) {
      onSend(message);
      setInput('');
      clearTranscript();
    }
  };

  const handleBudgetChipClick = (min: number, max: number) => {
    setPriceRange(min, max);
    // Send budget message
    const budgetMessage = `My budget is ${min > 0 ? `€${min} to ` : 'under '}€${max}`;
    addMessage({ role: 'user', content: budgetMessage });
    onSend(budgetMessage);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      // If we have a transcript, submit it
      if (transcript.trim()) {
        onSend(transcript.trim());
        clearTranscript();
        setInput('');
      }
    } else {
      startListening();
    }
  };

  // Show budget chips if no budget set
  const showBudgetChips = hasLocation && !hasBudget && priceMax === 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full px-4 pb-4 pt-2 border-t border-border/40 bg-background/70 backdrop-blur-2xl"
    >
      {/* Budget chips - shown when no budget is set */}
      {showBudgetChips && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">{t('set_budget')}</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {BUDGET_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleBudgetChipClick(chip.min, chip.max)}
                disabled={!hasLocation || isLoading}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  "bg-accent/10 text-accent border border-accent/20",
                  "hover:bg-accent/20 hover:border-accent/40",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        {/* Voice indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-lg"
            >
              🎙️ Listening... release to send
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic button - push to talk */}
        {isSupported && (
          <button
            type="button"
            onMouseDown={startListening}
            onMouseUp={handleMicClick}
            onMouseLeave={() => isListening && handleMicClick()}
            onTouchStart={startListening}
            onTouchEnd={handleMicClick}
            disabled={!hasLocation}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
              isListening 
                ? "bg-destructive text-destructive-foreground scale-110" 
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
              "disabled:opacity-50"
            )}
            title="Hold to speak"
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasLocation ? t('chat_placeholder') : t('chat_placeholder')}
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
          disabled={!hasLocation || isLoading || !input.trim()}
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
          <Home className="w-4 h-4" />
          <span className="hidden lg:inline">{t('search_homes')}</span>
        </button>
      </form>
    </motion.div>
  );
}
