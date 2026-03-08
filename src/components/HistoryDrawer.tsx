import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, MapPin, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useSession } from '@/hooks/useSession';
import type { Session } from '@/types';
import { cn } from '@/lib/utils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const { messages, clearMessages, setLocation, setListings, setAmenities } = useAppStore();
  const { getAllSessions, deleteSession } = useSession();

  const [sessions, setSessions] = useState<Session[]>([]);

  // Load sessions when drawer opens
  useEffect(() => {
    if (isOpen) {
      getAllSessions().then(data => {
        setSessions(data);
      });
    }
  }, [isOpen, getAllSessions]);

  const handleLoadSession = async (session: Session) => {
    // Restore session state
    if (session.location) {
      setLocation(session.location);
    }
    if (session.offersSnapshot) {
      setListings(session.offersSnapshot);
    }
    if (session.amenitiesSnapshot) {
      setAmenities(session.amenitiesSnapshot);
    }
    onClose();
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="nest-drawer z-[95] flex flex-col"
          >
            {/* Header */}
            <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">History</h2>
              </div>
              <button onClick={onClose} className="nest-icon-btn-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              {/* Current conversation */}
              {messages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Current Session
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {messages.slice(-20).map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg text-sm",
                          msg.role === 'user' 
                            ? 'bg-primary/10 text-foreground ml-4' 
                            : 'bg-muted text-foreground mr-4'
                        )}
                      >
                        <p className="text-xs text-muted-foreground mb-1 font-medium">
                          {msg.role === 'user' ? 'You' : 'NestAI'}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past sessions */}
              {sessions.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Past Sessions
                  </h3>
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleLoadSession(session)}
                        className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {session.location && (
                                <span className="flex items-center gap-1 text-xs text-primary">
                                  <MapPin className="w-3 h-3" />
                                  {session.location.city || session.location.label.split(',')[0]}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(session.createdAt)}
                              </span>
                            </div>
                            {session.messages.length > 0 && (
                              <p className="text-sm text-foreground line-clamp-1">
                                {session.messages[0].content}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {session.messages.length}
                              </span>
                              {session.offersSnapshot && (
                                <span>{session.offersSnapshot.length} offers</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 0 && sessions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversation history yet</p>
                  <p className="text-xs mt-1">Your chats will appear here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {messages.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-border shrink-0">
                <button
                  onClick={clearMessages}
                  className="nest-btn-secondary w-full flex items-center justify-center gap-2 text-sm text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Current Session
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
