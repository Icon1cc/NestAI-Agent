import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const { messages, clearMessages } = useAppStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-foreground/20 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="history-drawer"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="nest-drawer z-[95]"
          >
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">History</h2>
              </div>
              <button onClick={onClose} className="nest-icon-btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversation history yet</p>
                  <p className="text-xs mt-1">Your chats will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary/10 text-foreground ml-4' 
                          : 'bg-muted text-foreground mr-4'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        {msg.role === 'user' ? 'You' : 'NestAI'}
                      </p>
                      <p className="line-clamp-3">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {messages.length > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={clearMessages}
                  className="nest-btn-secondary w-full flex items-center justify-center gap-2 text-sm text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}