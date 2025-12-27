import React from 'react';
import { motion } from 'framer-motion';
import { transitions, getStaggerContainer, getStaggerItem } from '../../../utils/transitions';

const AnimatedContainer = ({ 
  children, 
  variant = 'page',
  stagger = false,
  staggerDelay = 0.1,
  className = '',
  ...props 
}) => {
  const getVariants = () => {
    if (stagger) {
      return getStaggerContainer(staggerDelay);
    }
    return transitions[variant] || transitions.page;
  };

  const variants = getVariants();

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Grid container with staggered animations
export const AnimatedGrid = ({ 
  children, 
  columns = 4,
  gap = 6,
  staggerDelay = 0.1,
  className = '',
  ...props 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }}
      exit={{ 
        opacity: 0,
        transition: {
          staggerChildren: staggerDelay,
          staggerDirection: -1
        }
      }}
      className={`grid ${gridClasses[columns] || gridClasses[4]} gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// List container with staggered animations
export const AnimatedList = ({ 
  children, 
  staggerDelay = 0.05,
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }}
      exit={{ 
        opacity: 0,
        transition: {
          staggerChildren: staggerDelay,
          staggerDirection: -1
        }
      }}
      className={`space-y-4 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Table container with staggered row animations
export const AnimatedTable = ({ 
  children, 
  staggerDelay = 0.02,
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }}
      exit={{ 
        opacity: 0,
        transition: {
          staggerChildren: staggerDelay,
          staggerDirection: -1
        }
      }}
      className={`overflow-hidden rounded-lg shadow-lg bg-white dark:bg-slate-800 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Modal container
export const AnimatedModal = ({ 
  children, 
  isOpen,
  onClose,
  className = '',
  ...props 
}) => {
  // Show modal when open
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-50"
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Tab container with smooth transitions
export const AnimatedTabs = ({ 
  children, 
  activeTab,
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Tab content with slide animations
export const AnimatedTabContent = ({ 
  children, 
  isActive,
  className = '',
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={isActive ? `block ${className}` : `hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Section container for page sections
export const AnimatedSection = ({ 
  children, 
  index = 0,
  delay = null,
  className = '',
  ...props 
}) => {
  const sectionDelay = delay !== null ? delay : index * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        delay: sectionDelay
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;
