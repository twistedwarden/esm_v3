import React from 'react';
import { motion } from 'framer-motion';
import { transitions, getCardDelay } from '../../../utils/transitions';

const AnimatedCard = ({ 
  children, 
  index = 0, 
  delay = null,
  className = '',
  hover = true,
  clickable = false,
  onClick = null,
  ...props 
}) => {
  const cardDelay = delay !== null ? delay : getCardDelay(index);
  
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3, 
        ease: "easeOut",
        delay: cardDelay
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    },
    hover: hover ? { 
      scale: 1.02, 
      y: -2,
      transition: { duration: 0.2 }
    } : {},
    tap: clickable ? { 
      scale: 0.98,
      transition: { duration: 0.1 }
    } : {}
  };

  const baseClasses = "bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transition-shadow duration-200";
  const hoverClasses = hover ? "hover:shadow-xl dark:hover:shadow-2xl" : "";
  const clickableClasses = clickable ? "cursor-pointer" : "";
  
  const combinedClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`.trim();

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={hover ? "hover" : undefined}
      whileTap={clickable ? "tap" : undefined}
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Specialized card variants
export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend = null,
  index = 0,
  className = '',
  ...props 
}) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500'
  };

  return (
    <AnimatedCard index={index} className={className} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              <span className="font-medium">{trend.value}</span>
              <span className="ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-gray-50 dark:bg-slate-700`}>
            <Icon className={`w-6 h-6 ${colorClasses[color] || colorClasses.blue}`} />
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export const InfoCard = ({ 
  title, 
  children, 
  icon: Icon,
  action = null,
  index = 0,
  className = '',
  ...props 
}) => {
  return (
    <AnimatedCard index={index} className={className} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-700">
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {action && (
          <div className="flex items-center space-x-2">
            {action}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </AnimatedCard>
  );
};

export const ActionCard = ({ 
  title, 
  description, 
  icon: Icon,
  onClick,
  color = 'blue',
  index = 0,
  className = '',
  ...props 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
  };

  return (
    <AnimatedCard 
      index={index} 
      clickable={true}
      onClick={onClick}
      className={`${colorClasses[color] || colorClasses.blue} ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-3">
        {Icon && (
          <Icon className="w-5 h-5" />
        )}
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </AnimatedCard>
  );
};

// Export default export
export default AnimatedCard;
