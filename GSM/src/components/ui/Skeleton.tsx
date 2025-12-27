import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    <Skeleton variant="rectangular" height={200} className="mb-4" />
    <Skeleton variant="text" height={24} className="mb-2" />
    <Skeleton variant="text" height={20} width="80%" className="mb-2" />
    <Skeleton variant="text" height={20} width="60%" />
  </div>
);

export const SkeletonButton: React.FC<{ className?: string; width?: string | number }> = ({ 
  className = '', 
  width = 120 
}) => (
  <Skeleton variant="rectangular" height={40} width={width} className={className} />
);

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <Skeleton variant="text" height={14} width={100} />
    <Skeleton variant="rectangular" height={40} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} width={`${100 / cols}%`} />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-gray-100">
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} width={`${100 / cols}%`} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ 
  size?: number; 
  className?: string 
}> = ({ 
  size = 40, 
  className = '' 
}) => (
  <Skeleton variant="circular" width={size} height={size} className={className} />
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton variant="text" height={32} width={300} />
        <Skeleton variant="text" height={20} width={200} />
      </div>
      <SkeletonButton width={120} />
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <Skeleton variant="text" height={16} width={100} className="mb-4" />
          <Skeleton variant="text" height={32} width={80} className="mb-2" />
          <Skeleton variant="text" height={14} width={120} />
        </div>
      ))}
    </div>

    {/* Content area */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton variant="text" height={20} width={150} className="mb-4" />
          <Skeleton variant="rectangular" height={100} className="mb-4" />
          <Skeleton variant="text" height={16} width="100%" className="mb-2" />
          <Skeleton variant="text" height={16} width="80%" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="bg-white rounded-lg shadow-md p-8">
    <Skeleton variant="text" height={28} width={250} className="mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonInput key={i} />
      ))}
    </div>
    <div className="mt-6 flex space-x-4">
      <SkeletonButton width={120} />
      <SkeletonButton width={100} />
    </div>
  </div>
);

export const SkeletonApplicationStatus: React.FC = () => (
  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 mb-6">
    <Skeleton variant="text" height={12} width={120} className="mb-2 bg-orange-400" />
    <Skeleton variant="text" height={36} width={200} className="mb-4 bg-orange-400" />
    <div className="flex items-center space-x-4">
      <Skeleton variant="text" height={16} width={150} className="bg-orange-400" />
      <Skeleton variant="text" height={16} width={120} className="bg-orange-400" />
    </div>
  </div>
);

export const SkeletonDocumentsList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2 flex-1">
            <Skeleton variant="circular" width={16} height={16} className="mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" height={16} width="80%" />
              <Skeleton variant="text" height={12} width="60%" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton variant="rectangular" height={24} width={80} className="rounded-full" />
            <Skeleton variant="rectangular" height={24} width={32} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

