import React from 'react';
import AdvancedAnalyticsDashboard from '../../../../../components/analytics/AdvancedAnalyticsDashboard';

const AnalyticsReport = () => {
    // Get token from storage
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';

    return (
        <div className="w-full">
            <AdvancedAnalyticsDashboard />
        </div>
    );
};

export default AnalyticsReport;
