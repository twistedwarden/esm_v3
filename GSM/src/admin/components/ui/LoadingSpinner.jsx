import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import StandardLoading from './StandardLoading';

const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "default",
  className = "",
  showIcon = true 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'h-32',
          icon: 'w-6 h-6',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'h-96',
          icon: 'w-12 h-12',
          text: 'text-lg'
        };
      default:
        return {
          container: 'h-64',
          icon: 'w-8 h-8',
          text: 'text-base'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center justify-center ${sizeClasses.container} ${className}`}>
      <div className="text-center">
        {showIcon && (
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`${sizeClasses.icon} text-gray-500`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <RefreshCw className="w-full h-full" />
            </motion.div>
          </motion.div>
        )}
        <motion.p 
          className={`${sizeClasses.text} text-gray-500 font-medium`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

// Specialized loading components for common use cases
export const LoadingDecisions = ({ className = "" }) => (
  <LoadingSpinner 
    message="Loading decisions.." 
    className={className}
  />
);

export const LoadingUsers = ({ className = "" }) => (
  <LoadingSpinner 
    message="Loading users..." 
    className={className}
  />
);

export const LoadingDashboard = ({ className = "" }) => (
  <LoadingSpinner 
    message="Loading dashboard..." 
    className={className}
  />
);

export const LoadingApplications = ({ className = "" }) => (
  <LoadingSpinner 
    message="Loading applications..." 
    className={className}
  />
);

export const LoadingStudents = ({ className = "" }) => (
  <LoadingSpinner 
    message="Loading students..." 
    className={className}
  />
);

export const LoadingData = ({ className = "", module = "default" }) => (
  <StandardLoading 
    variant="module"
    module={module}
    message="Loading data..." 
    className={className}
  />
);

export default LoadingSpinner;
