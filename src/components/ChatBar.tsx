import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Loader2, MicOff, VolumeX, Home } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ChatBarProps {
  onSend: (message: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  hasLocation: boolean;
}

export function ChatBar({ onSend, onSearch, isLoading, hasLocation }: ChatBarProps) {
  const [input, setInput] = useState('');
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

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        onSend(transcript.trim());
        clearTranscript();
        setInput('');
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full">
      {/* Voice indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mb-2 flex justify-center"
          >
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-lg">
              🎙️ Listening... release to send
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Mic button */}
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
              'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              isListening
                ? 'bg-destructive text-destructive-foreground scale-110'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
              'disabled:opacity-50'
            )}
            title="Hold to speak"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat_placeholder')}
            disabled={!hasLocation || isLoading}
            className="nest-input w-full h-10 sm:h-12 text-sm sm:text-base pr-10"
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
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!hasLocation || isLoading || !input.trim()}
          className={cn(
            'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Search button */}
        <button
          type="button"
          onClick={onSearch}
          disabled={!hasLocation || isLoading}
          className={cn(
            'h-10 sm:h-11 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0',
            'font-medium text-xs sm:text-sm transition-all',
            'text-accent-foreground',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
          style={{
            background: 'var(--gradient-accent)',
            boxShadow: 'var(--shadow-md), 0 0 20px -5px hsl(var(--accent) / 0.4)',
          }}
        >
          <Home className="w-4 h-4" />
          <span className="hidden xs:inline">{t('search_homes')}</span>
        </button>
      </form>
    </div>
  );
}
