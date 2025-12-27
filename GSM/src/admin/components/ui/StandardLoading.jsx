import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Database, Users, FileText, BarChart3, Settings, Archive } from 'lucide-react';
import { transitions } from '../../../utils/transitions';

// Loading spinner component
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center justify-center ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
    </motion.div>
  );
};

// Loading skeleton for cards
const LoadingCard = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 ${className}`}
  >
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    </div>
  </motion.div>
);

// Loading skeleton for table rows
const LoadingTableRow = ({ columns = 4 }) => (
  <motion.tr
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="animate-pulse"
  >
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
      </td>
    ))}
  </motion.tr>
);

// Loading skeleton for list items
const LoadingListItem = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`p-4 border-b border-gray-200 dark:border-slate-700 ${className}`}
  >
    <div className="animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
    </div>
  </motion.div>
);

// Module-specific loading screens
const ModuleLoadingScreen = ({ module, message = 'Loading...' }) => {
  const getModuleIcon = (module) => {
    switch (module) {
      case 'students': return Users;
      case 'applications': return FileText;
      case 'reports': return BarChart3;
      case 'settings': return Settings;
      case 'archived': return Archive;
      default: return Database;
    }
  };

  const IconComponent = getModuleIcon(module);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative"
      >
        <IconComponent className="w-16 h-16 text-orange-500" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute -top-2 -right-2"
        >
          <Loader2 className="w-6 h-6 text-orange-400" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {message}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we load the data...
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex space-x-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2 
            }}
            className="w-2 h-2 bg-orange-500 rounded-full"
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

// Grid loading skeleton
const LoadingGrid = ({ columns = 4, rows = 3, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${className}`}
  >
    {Array.from({ length: columns * rows }).map((_, index) => (
      <LoadingCard key={index} />
    ))}
  </motion.div>
);

// Table loading skeleton
const LoadingTable = ({ columns = 5, rows = 5, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}
  >
    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-slate-700">
      {Array.from({ length: rows }).map((_, index) => (
        <LoadingTableRow key={index} columns={columns} />
      ))}
    </div>
  </motion.div>
);

// List loading skeleton
const LoadingList = ({ items = 5, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}
  >
    {Array.from({ length: items }).map((_, index) => (
      <LoadingListItem key={index} />
    ))}
  </motion.div>
);

// Main loading component with different variants
const StandardLoading = ({ 
  variant = 'module', 
  module = 'default',
  message = 'Loading...',
  size = 'md',
  className = '',
  columns = 4,
  rows = 3,
  items = 5
}) => {
  switch (variant) {
    case 'spinner':
      return <LoadingSpinner size={size} className={className} />;
    
    case 'card':
      return <LoadingCard className={className} />;
    
    case 'grid':
      return <LoadingGrid columns={columns} rows={rows} className={className} />;
    
    case 'table':
      return <LoadingTable columns={columns} rows={rows} className={className} />;
    
    case 'list':
      return <LoadingList items={items} className={className} />;
    
    case 'module':
    default:
      return <ModuleLoadingScreen module={module} message={message} />;
  }
};

// Export individual components and main component
export {
  LoadingSpinner,
  LoadingCard,
  LoadingTableRow,
  LoadingListItem,
  ModuleLoadingScreen,
  LoadingGrid,
  LoadingTable,
  LoadingList
};

export default StandardLoading;
