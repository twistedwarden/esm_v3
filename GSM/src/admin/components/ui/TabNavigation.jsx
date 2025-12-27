import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "",
  layoutId = "activeTab",
  showUnderline = true,
  variant = "default" // "default" | "compact" | "large"
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'py-2 px-2 sm:px-3 text-xs sm:text-sm';
      case 'large':
        return 'py-3 sm:py-4 px-2 sm:px-3 text-sm sm:text-base';
      default:
        return 'py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm';
    }
  };

  return (
    <div className={`border-b border-gray-200 dark:border-slate-700 ${className}`}>
      <nav className="-mb-px flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto relative">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${getVariantClasses()} font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.3,
              ease: "easeOut"
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.label}
            {showUnderline && activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                layoutId={layoutId}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.3
                }}
              />
            )}
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

export const AnimatedTabContent = ({ 
  activeTab, 
  children, 
  className = "" 
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default TabNavigation;

