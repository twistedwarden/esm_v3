import React from 'react';
import StreamlinedDashboard from './streamlined/StreamlinedDashboard';

/**
 * Main entry point for the Admin Dashboard.
 * Now renders the StreamlinedDashboard which focuses on key metrics.
 */
function DashboardOverview({ onPageChange }) {
  return <StreamlinedDashboard onPageChange={onPageChange} />;
}

export default DashboardOverview;