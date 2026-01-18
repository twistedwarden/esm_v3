import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  PhilippinePeso, 
  Users, 
  Clock,
  CheckCircle,
  School,
  ArrowRight
} from 'lucide-react';

const Overview = () => {
  const [metrics, setMetrics] = useState({
    totalApproved: 0,
    totalAmount: 0,
    completedDisbursements: 0,
    pendingAmount: 0,
    avgProcessingTime: 0,
    schoolsAwaitingPayment: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchRecentActivities();
  }, []);

  const fetchMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/disbursements/metrics');
      // const data = await response.json();
      
      // Mock data for development
      setMetrics({
        totalApproved: 156,
        totalAmount: 7850000,
        completedDisbursements: 89,
        pendingAmount: 3375000,
        avgProcessingTime: 3.5,
        schoolsAwaitingPayment: 12,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = () => {
    // Mock recent activities
    setRecentActivities([
      {
        id: 1,
        action: 'Disbursement Completed',
        description: 'Batch payment to University of the Philippines (25 scholars)',
        amount: 1250000,
        timestamp: '2 hours ago',
        status: 'completed'
      },
      {
        id: 2,
        action: 'Processing Started',
        description: 'Batch payment to Ateneo de Manila (15 scholars)',
        amount: 750000,
        timestamp: '5 hours ago',
        status: 'processing'
      },
      {
        id: 3,
        action: 'Funds Allocated',
        description: 'Government fund received - Q4 2024',
        amount: 5000000,
        timestamp: '1 day ago',
        status: 'completed'
      },
      {
        id: 4,
        action: 'Disbursement Completed',
        description: 'Batch payment to De La Salle University (20 scholars)',
        amount: 980000,
        timestamp: '2 days ago',
        status: 'completed'
      },
    ]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={Users}
          title="Approved Scholarships"
          value={formatNumber(metrics.totalApproved)}
          subtitle="Pending disbursement"
          color="text-blue-600"
        />
        <MetricCard
          icon={PhilippinePeso}
          title="Total Amount for Disbursement"
          value={formatCurrency(metrics.totalAmount)}
          subtitle="Ready to process"
          color="text-purple-600"
        />
        <MetricCard
          icon={CheckCircle}
          title="Completed Disbursements"
          value={formatNumber(metrics.completedDisbursements)}
          subtitle="This month"
          color="text-green-600"
          trend="+12%"
        />
        <MetricCard
          icon={Clock}
          title="Pending Amount"
          value={formatCurrency(metrics.pendingAmount)}
          subtitle="Awaiting processing"
          color="text-yellow-600"
        />
        <MetricCard
          icon={TrendingUp}
          title="Avg Processing Time"
          value={`${metrics.avgProcessingTime} days`}
          subtitle="Target: 5 days"
          color="text-indigo-600"
        />
        <MetricCard
          icon={School}
          title="Schools Awaiting Payment"
          value={formatNumber(metrics.schoolsAwaitingPayment)}
          subtitle="Requires action"
          color="text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group">
            <div className="text-left">
              <p className="font-medium text-gray-900">Process New Batch</p>
              <p className="text-sm text-gray-600">Start disbursement</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors group">
            <div className="text-left">
              <p className="font-medium text-gray-900">View Urgent Requests</p>
              <p className="text-sm text-gray-600">Priority items</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group">
            <div className="text-left">
              <p className="font-medium text-gray-900">Generate Report</p>
              <p className="text-sm text-gray-600">Quick summary</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Distribution Status & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-sm font-bold text-yellow-600">67 (43%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '43%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completed</span>
                <span className="text-sm font-bold text-green-600">89 (57%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '57%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <span className="text-sm font-bold text-blue-600">0 (0%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Scholarships</span>
              <span className="text-lg font-bold text-gray-900">156</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {activity.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(activity.amount)}
                    </span>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Schools by Disbursement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Schools by Disbursement Volume</h3>
        <div className="space-y-4">
          {[
            { school: 'University of the Philippines', amount: 2450000, scholars: 49 },
            { school: 'Ateneo de Manila University', amount: 1890000, scholars: 38 },
            { school: 'De La Salle University', amount: 1680000, scholars: 34 },
            { school: 'University of Santo Tomas', amount: 980000, scholars: 20 },
            { school: 'Polytechnic University of the Philippines', amount: 850000, scholars: 17 },
          ].map((school, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-8 text-center">
                <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{school.school}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(school.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(school.amount / 2450000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{school.scholars} scholars</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;

