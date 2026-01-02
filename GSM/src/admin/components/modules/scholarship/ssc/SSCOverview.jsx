import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  FileCheck,
  DollarSign,
  Calendar,
  Award,
  BarChart3,
  Settings
} from 'lucide-react';
import { sscRoleService } from '../../../../../services/sscRoleService';

import AdminApplicationChecklist from './AdminApplicationChecklist';

function SSCOverview() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    underAppeal: 0,
    totalMembers: 0,
    activeMembers: 0,
    averageProcessingTime: 0,
    thisMonthDecisions: 0,
    pendingAppeals: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRoles, setUserRoles] = useState(null);
  const [myQueueCount, setMyQueueCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Check for admin role
        try {
          const userDataStr = localStorage.getItem('user_data');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log('SSCOverview - User Data:', userData);
            // Check if role is strictly 'admin' or 'super_admin'
            // Adjust this condition based on your exact role strings
            if (userData.role === 'admin' || userData.role === 'super_admin' || userData.is_admin) {
              setIsAdmin(true);
            }
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }

        // Fetch user's SSC roles
        const roles = await sscRoleService.fetchUserRoles();
        setUserRoles(roles);

        // Fetch real data from API
        const { scholarshipApiService } = await import('../../../../../services/scholarshipApiService');
        const response = await scholarshipApiService.getSscStatistics();
        const statsData = response.data || {};

        // Fetch user's queue count
        if (roles.has_ssc_role) {
          try {
            const myApps = await scholarshipApiService.getMySscApplications({ per_page: 1 });
            setMyQueueCount(myApps.total || 0);
          } catch (err) {
            console.error('Error fetching my queue count:', err);
          }
        }

        // Fetch stage-specific counts
        const [docVerification, financialReview, academicReview, finalApproval] = await Promise.all([
          scholarshipApiService.getSscApplicationsByStage('document_verification', { per_page: 1 }),
          scholarshipApiService.getSscApplicationsByStage('financial_review', { per_page: 1 }),
          scholarshipApiService.getSscApplicationsByStage('academic_review', { per_page: 1 }),
          scholarshipApiService.getSscApplicationsByStage('final_approval', { per_page: 1 })
        ]);

        setStats({
          totalApplications: statsData.totalApplications || 0,
          pendingReview: statsData.pendingReview || 0,
          approved: statsData.approved || 0,
          rejected: statsData.rejected || 0,
          underAppeal: 0, // Will be implemented in future
          totalMembers: 12, // Static for now
          activeMembers: 10, // Static for now
          averageProcessingTime: statsData.averageProcessingTime || 0,
          thisMonthDecisions: statsData.thisMonthDecisions || 0,
          pendingAppeals: 0, // Will be implemented in future
          // Stage-specific counts
          documentVerification: docVerification.total || 0,
          financialReview: financialReview.total || 0,
          academicReview: academicReview.total || 0,
          finalApproval: finalApproval.total || 0
        });

        // Fetch recent decision history as activity
        try {
          const historyData = await scholarshipApiService.getSscDecisionHistory({
            per_page: 5,
            sort_by: 'decided_at',
            sort_order: 'desc'
          });

          const activities = (historyData.data || []).map((decision, index) => ({
            id: index + 1,
            type: decision.decision === 'approved' ? 'approval' : 'rejection',
            applicationId: decision.application?.application_number || `APP-${decision.application_id}`,
            studentName: `${decision.application?.student?.first_name || ''} ${decision.application?.student?.last_name || ''}`.trim(),
            member: 'SSC Committee', // Will get from decided_by user in future
            timestamp: decision.decided_at,
            status: decision.decision
          }));

          setRecentActivities(activities);
        } catch (err) {
          console.error('Error loading recent activities:', err);
          setRecentActivities([]);
        }
      } catch (err) {
        setError('Failed to load SSC data');
        console.error('Error loading SSC data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Role-specific stat cards
  const getRoleSpecificCards = () => {
    const baseCards = [];

    // My Queue - Always shown for non-chairperson roles
    if (userRoles && !userRoles.is_chairperson && userRoles.has_ssc_role) {
      baseCards.push({
        title: 'My Queue',
        value: myQueueCount,
        icon: Award,
        color: 'orange',
        change: `Assigned to you`,
        changeType: 'neutral'
      });
    }

    // Stage-specific cards based on role
    if (userRoles && userRoles.stages) {
      if (userRoles.stages.includes('document_verification')) {
        baseCards.push({
          title: 'Document Verification',
          value: stats.documentVerification,
          icon: FileCheck,
          color: 'blue',
          change: 'Pending verification',
          changeType: 'neutral'
        });
      }
      if (userRoles.stages.includes('financial_review')) {
        baseCards.push({
          title: 'Financial Review',
          value: stats.financialReview,
          icon: DollarSign,
          color: 'yellow',
          change: 'Pending review',
          changeType: 'neutral'
        });
      }
      if (userRoles.stages.includes('academic_review')) {
        baseCards.push({
          title: 'Academic Review',
          value: stats.academicReview,
          icon: BarChart3,
          color: 'purple',
          change: 'Pending review',
          changeType: 'neutral'
        });
      }
      if (userRoles.stages.includes('final_approval') || userRoles.is_chairperson) {
        baseCards.push({
          title: 'Final Approval',
          value: stats.finalApproval,
          icon: CheckCircle,
          color: 'green',
          change: 'Awaiting decision',
          changeType: 'neutral'
        });
      }
    }

    // Chairperson OR Admin sees all stats
    if ((userRoles && userRoles.is_chairperson) || isAdmin) {
      return [
        {
          title: 'Total Applications',
          value: stats.totalApplications,
          icon: FileText,
          color: 'blue',
          change: 'In SSC process',
          changeType: 'neutral'
        },
        {
          title: 'Pending Review',
          value: stats.pendingReview,
          icon: Clock,
          color: 'yellow',
          change: 'Across all stages',
          changeType: 'neutral'
        },
        {
          title: 'Approved',
          value: stats.approved,
          icon: CheckCircle,
          color: 'green',
          change: 'Total approved',
          changeType: 'positive'
        },
        {
          title: 'Rejected',
          value: stats.rejected,
          icon: XCircle,
          color: 'red',
          change: 'Total rejected',
          changeType: 'neutral'
        },
        {
          title: 'This Month Decisions',
          value: stats.thisMonthDecisions,
          icon: Calendar,
          color: 'purple',
          change: `${stats.thisMonthDecisions} decisions`,
          changeType: 'neutral'
        },
        {
          title: 'Active Members',
          value: `${stats.activeMembers}/${stats.totalMembers}`,
          icon: Users,
          color: 'purple',
          change: 'SSC members',
          changeType: 'neutral'
        }
      ];
    }

    return baseCards;
  };

  const statCards = getRoleSpecificCards();

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  const getChangeColor = (changeType) => {
    const colors = {
      positive: 'text-green-600',
      negative: 'text-red-600',
      neutral: 'text-gray-600'
    };
    return colors[changeType] || colors.neutral;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">SSC Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Student Services Committee - Application Review & Decision Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`text-xs sm:text-sm ${getChangeColor(card.changeType)}`}>
                    {card.change} from last month
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full ${getColorClasses(card.color)}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIN-ONLY CHECKLIST */}
      {isAdmin && (
        <div className="mb-8">
          <AdminApplicationChecklist />
        </div>
      )}

      {/* Stage Pipeline Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
          SSC Review Pipeline
        </h3>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
              <span className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.documentVerification}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Document</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Verification</div>
          </div>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full"></div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-2">
              <span className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.financialReview}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Financial</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Review</div>
          </div>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-purple-500 rounded-full"></div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
              <span className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.academicReview}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Academic</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Review</div>
          </div>

          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-green-500 rounded-full"></div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
              <span className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.finalApproval}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Final</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Approval</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Pending Applications */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Pending Applications</h3>
            <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-0.5 rounded-full">
              {stats.pendingReview} pending
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Applications awaiting SSC review and decision
          </p>
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors shadow-sm">
            Review Applications
          </button>
        </div>

        {/* Processing Time */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avg. Processing Time</h3>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {stats.averageProcessingTime} days
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Average time from endorsement to decision
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageProcessingTime}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {activity.type === 'approval' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {activity.type === 'rejection' && <XCircle className="h-5 w-5 text-red-500" />}
                      {activity.type === 'review' && <Clock className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.type === 'approval' && 'Application approved'}
                        {activity.type === 'rejection' && 'Application rejected'}
                        {activity.type === 'review' && 'Application under review'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.studentName} • {activity.applicationId}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default SSCOverview;
