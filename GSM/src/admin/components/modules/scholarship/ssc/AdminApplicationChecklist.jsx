import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Search,
  CheckSquare
} from 'lucide-react';
import { scholarshipApiService } from '../../../../../services/scholarshipApiService';

function AdminApplicationChecklist() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch recent applications with a 'pending_ssc_review' or relevant status
      // We might want to fetch all 'endorsed_to_ssc' applications
      const response = await scholarshipApiService.getApplications({
        status: 'endorsed_to_ssc',
        per_page: 10,
        sort_by: 'submitted_at',
        sort_order: 'desc'
      });
      setApplications(response.data || []);
    } catch (err) {
      console.error('Error fetching applications for checklist:', err);
      setError('Failed to load application checklist');
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely extract stage status
  const getStageStatus = (app, stage) => {
    // If ssc_stage_status is null or undefined, stage is pending
    if (!app.ssc_stage_status) return 'pending';

    // Check if it's a JSON string (as seen in some legacy handling) or object
    let statusData = app.ssc_stage_status;
    if (typeof statusData === 'string') {
      try {
        statusData = JSON.parse(statusData);
      } catch (e) {
        console.error('Error parsing ssc_stage_status:', e);
        return 'pending';
      }
    }

    // Access the specific stage
    const stageInfo = statusData[stage];
    if (!stageInfo) return 'pending';

    return stageInfo.status || 'pending';
  };

  const renderStatusBadge = (status) => {
    if (status === 'approved' || status === 'passed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      );
    }
    if (status === 'rejected' || status === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading checklist...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mt-6">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
            Application Processing Checklist
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track completion of review stages for active applications
          </p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Document Verification
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Financial Review
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Academic Review
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Final Decision
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {applications.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No applications currently in SSC review pipeline.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {app.student?.first_name} {app.student?.last_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {app.application_number}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Document Review Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      {renderStatusBadge(getStageStatus(app, 'document_verification'))}
                    </div>
                  </td>

                  {/* Financial Review Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      {renderStatusBadge(getStageStatus(app, 'financial_review'))}
                    </div>
                  </td>

                  {/* Academic Review Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      {renderStatusBadge(getStageStatus(app, 'academic_review'))}
                    </div>
                  </td>

                  {/* Final Decision */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      {/* Final decision is often the main status if approved/rejected, OR in ssc_stage_status.final_approval */}
                      {app.status === 'approved' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      ) : app.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </span>
                      ) : (
                        renderStatusBadge(getStageStatus(app, 'final_approval'))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminApplicationChecklist;
