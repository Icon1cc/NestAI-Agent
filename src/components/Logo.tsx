import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const { resetLocation } = useAppStore();
  
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  };

  const { icon, text } = sizes[size];

  const handleClick = () => {
    resetLocation();
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Go to home"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          {/* Abstract bird/nest shape - modern and friendly */}
          <defs>
            <linearGradient id="nestGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Main circular nest shape */}
          <circle 
            cx="24" 
            cy="26" 
            r="16" 
            fill="url(#nestGradient)" 
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2"
          />
          
          {/* Stylized bird silhouette */}
          <path
            d="M14 24C14 24 18 18 24 18C30 18 34 24 34 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Bird head */}
          <circle cx="32" cy="20" r="4" fill="currentColor" />
          
          {/* Beak */}
          <path
            d="M35 19L40 17L36 21"
            fill="currentColor"
          />
          
          {/* Nest lines - cozy twigs */}
          <path
            d="M16 30C16 30 20 28 24 28C28 28 32 30 32 30"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M18 34C18 34 21 32 24 32C27 32 30 34 30 34"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          
          {/* AI sparkle dots */}
          <circle cx="12" cy="14" r="1.5" fill="currentColor" opacity="0.6" />
          <circle cx="8" cy="20" r="1" fill="currentColor" opacity="0.4" />
          <circle cx="40" cy="32" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </motion.div>
      
      {showText && (
        <motion.span
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`font-bold ${text} tracking-tight`}
        >
          <span className="text-foreground">Nest</span>
          <span className="text-gradient-hero">AI</span>
        </motion.span>
      )}
    </button>
  );
}