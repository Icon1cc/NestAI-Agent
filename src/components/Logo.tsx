import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
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
          {/* Nest/House shape */}
          <path
            d="M24 4L4 20V44H18V30H30V44H44V20L24 4Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* AI circuit pattern inside */}
          <circle cx="24" cy="24" r="4" fill="currentColor" />
          <path
            d="M24 20V16M24 28V32M20 24H16M28 24H32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="16" r="2" fill="currentColor" fillOpacity="0.6" />
          <circle cx="24" cy="32" r="2" fill="currentColor" fillOpacity="0.6" />
          <circle cx="16" cy="24" r="2" fill="currentColor" fillOpacity="0.6" />
          <circle cx="32" cy="24" r="2" fill="currentColor" fillOpacity="0.6" />
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
    </div>
  );
}
