import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
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
      className={cn('flex items-center gap-2 hover:opacity-80 transition-opacity', className)}
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
          {/* Modern house icon with AI elements */}
          <defs>
            <linearGradient id="houseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* House roof */}
          <path
            d="M24 6L6 22H12V40H36V22H42L24 6Z"
            fill="url(#houseGradient)"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          
          {/* Door */}
          <rect
            x="20"
            y="26"
            width="8"
            height="14"
            rx="1"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          
          {/* Window left */}
          <rect
            x="14"
            y="24"
            width="5"
            height="5"
            rx="0.5"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          
          {/* Window right */}
          <rect
            x="29"
            y="24"
            width="5"
            height="5"
            rx="0.5"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          
          {/* AI sparkle elements */}
          <circle cx="38" cy="10" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="43" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
          <circle cx="40" cy="6" r="1" fill="currentColor" opacity="0.6" />
        </svg>
      </motion.div>
      
      {showText && (
        <motion.span
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`font-bold ${text} tracking-tight`}
        >
          <span className="text-foreground">NestAI</span>
          <span className="text-gradient-hero ml-1">Agent</span>
        </motion.span>
      )}
    </button>
  );
}