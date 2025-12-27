import React from 'react';
import { useAuthStore } from '../store/v1authStore';
import PartnerSchoolDashboard from './PartnerSchoolDashboard';

const PartnerSchoolApp = () => {
  const { currentUser, logout } = useAuthStore();

  // Check if user is PS_rep, if not redirect to login
  if (!currentUser || currentUser.role !== 'ps_rep') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <PartnerSchoolDashboard />;
};

export default PartnerSchoolApp;
