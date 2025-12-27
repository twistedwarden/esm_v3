import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  FileText, 
  Calendar,
  TrendingUp,
  Award,
  School,
  BarChart3,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { LoadingApplications } from '../../../ui/LoadingSpinner';
import StandardLoading from '../../../ui/StandardLoading';
import AnimatedContainer, { AnimatedGrid, AnimatedSection } from '../../../ui/AnimatedContainer';
import AnimatedCard, { StatsCard } from '../../../ui/AnimatedCard';

function ApplicationOverview() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    verifiedStudents: 0,
    scheduledInterviews: 0,
    endorsedToSSC: 0
  });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalApplications: 156,
        pendingReview: 23,
        underReview: 18,
        approved: 89,
        rejected: 26,
        verifiedStudents: 67,
        scheduledInterviews: 12,
        endorsedToSSC: 45
      });

      setRecentActivities([
        {
          id: 1,
          type: 'application',
          message: 'New application submitted by Juan Dela Cruz',
          time: '2 hours ago',
          status: 'pending'
        },
        {
          id: 2,
          type: 'approval',
          message: 'Application approved for Maria Santos',
          time: '4 hours ago',
          status: 'approved'
        },
        {
          id: 3,
          type: 'interview',
          message: 'Interview scheduled for Pedro Reyes',
          time: '1 day ago',
          status: 'scheduled'
        },
        {
          id: 4,
          type: 'endorsement',
          message: 'Application endorsed to SSC for Ana Garcia',
          time: '2 days ago',
          status: 'endorsed'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'application':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'interview':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'endorsement':
        return <Award className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'endorsed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return <StandardLoading variant="module" module="applications" message="Loading applications..." />;
  }

  return (
    <AnimatedContainer variant="page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Application Management Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage scholarship applications across all stages
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button 
            onClick={fetchOverviewData}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <AnimatedGrid columns={4} staggerDelay={0.1}>
        <StatsCard
          title="Total Applications"
          value={stats.totalApplications.toLocaleString()}
          icon={Users}
          color="blue"
          index={0}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview.toLocaleString()}
          icon={Clock}
          color="yellow"
          index={1}
        />
        <StatsCard
          title="Under Review"
          value={stats.underReview.toLocaleString()}
          icon={FileText}
          color="blue"
          index={2}
        />
        <StatsCard
          title="Approved"
          value={stats.approved.toLocaleString()}
          icon={CheckCircle}
          color="green"
          index={3}
        />
        <StatsCard
          title="Verified Students"
          value={stats.verifiedStudents.toLocaleString()}
          icon={School}
          color="purple"
          index={4}
        />
        <StatsCard
          title="Scheduled Interviews"
          value={stats.scheduledInterviews.toLocaleString()}
          icon={Calendar}
          color="indigo"
          index={5}
        />
        <StatsCard
          title="Endorsed to SSC"
          value={stats.endorsedToSSC.toLocaleString()}
          icon={Award}
          color="orange"
          index={6}
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected.toLocaleString()}
          icon={AlertTriangle}
          color="red"
          index={7}
        />
      </AnimatedGrid>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
          <button className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 text-left rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Review Applications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Process pending applications</p>
              </div>
            </div>
          </button>

          <button className="p-4 text-left rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <School className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Verify Students</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check enrollment status</p>
              </div>
            </div>
          </button>

          <button className="p-4 text-left rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Schedule Interviews</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set up interview sessions</p>
              </div>
            </div>
          </button>

          <button className="p-4 text-left rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Endorse to SSC</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Forward approved applications</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </AnimatedContainer>
  );
}

export default ApplicationOverview;
