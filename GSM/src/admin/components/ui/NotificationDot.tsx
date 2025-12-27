import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationDotProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
}

const NotificationDot: React.FC<NotificationDotProps> = ({ 
  count, 
  className = '', 
  size = 'md',
  showZero = false 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`
          ${sizeClasses[size]} 
          bg-red-500 
          rounded-full 
          shadow-lg
          border-2 border-white
          absolute top-0 right-0
          z-10
          ${className}
        `}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          duration: 0.3
        }}
        whileHover={{ scale: 1.1 }}
        title={`${count} new notifications`}
      />
    </AnimatePresence>
  );
};

export default NotificationDot;
