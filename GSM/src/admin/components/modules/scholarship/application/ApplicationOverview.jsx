import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  RefreshCw,
  Download,
  Lock,
  X
} from 'lucide-react';
import { LoadingApplications } from '../../../ui/LoadingSpinner';
import StandardLoading from '../../../ui/StandardLoading';
import AnimatedContainer, { AnimatedGrid, AnimatedSection } from '../../../ui/AnimatedContainer';
import AnimatedCard, { StatsCard } from '../../../ui/AnimatedCard';
import scholarshipApiService from '../../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';

function ApplicationOverview() {
  const { success, error: showError, warning, info } = useToastContext();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    verifiedStudents: 0,
    scheduledInterviews: 0,
    endorsedToSSC: 0,
    activeSchoolYear: 'N/A',
    activeSemester: 'N/A'
  });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [password, setPassword] = useState('');
  
  const [schools, setSchools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  const [filters, setFilters] = useState({
    status: 'all',
    school_id: 'all',
    category_id: 'all',
    subcategory_id: 'all',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (showExportModal) {
      fetchFilterOptions();
    }
  }, [showExportModal]);

  const fetchFilterOptions = async () => {
    try {
      const [schoolsData, categoriesData] = await Promise.all([
        scholarshipApiService.getSchools(),
        scholarshipApiService.getScholarshipCategories()
      ]);
      setSchools(schoolsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  useEffect(() => {
    if (filters.category_id && filters.category_id !== 'all') {
      const selectedCategory = categories.find(c => c.id.toString() === filters.category_id.toString());
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  }, [filters.category_id, categories]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset subcategory if category changes
      ...(name === 'category_id' ? { subcategory_id: 'all' } : {})
    }));
  };

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const data = await scholarshipApiService.getDashboardOverview();

      setStats({
        totalApplications: data.stats.totalApplications || 0,
        pendingReview: data.stats.pendingReview || 0,
        underReview: data.stats.underReview || 0,
        approved: data.stats.approved || 0,
        rejected: data.stats.rejected || 0,
        verifiedStudents: data.stats.verifiedStudents || 0,
        scheduledInterviews: data.stats.scheduledInterviews || 0,
        endorsedToSSC: data.stats.endorsedToSSC || 0,
        activeSchoolYear: data.stats.activeSchoolYear || 'N/A',
        activeSemester: data.stats.activeSemester || 'N/A'
      });

      setRecentActivities(data.recentActivities || []);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setShowExportModal(false);

      // Fetch report data
      const data = await scholarshipApiService.getApplicationsReportData(filters);

      if (!data || data.length === 0) {
        showError('No applications found to export');
        return;
      }

      // Configure PDF options, including encryption if password is provided
      const pdfOptions = { orientation: 'landscape' };
      if (password) {
        pdfOptions.encryption = {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ["print", "modify", "copy", "annot-forms"]
        };
      }

      const doc = new jsPDF(pdfOptions);

      const timestamp = new Date().toLocaleString();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("Scholarship Applications Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${timestamp}`, 14, 28);
      doc.text(`Total Records: ${data.length}`, 14, 33);

      doc.setLineWidth(0.5);
      doc.line(14, 38, 283, 38);

      const tableRows = data.map(app => [
        app.application_number || 'N/A',
        app.student ? `${app.student.first_name} ${app.student.last_name}` : 'N/A',
        app.school ? `${app.school.name}${app.school.campus ? ` - ${app.school.campus}` : ''}` : 'N/A',
        app.category ? app.category.name : 'N/A',
        app.subcategory ? app.subcategory.name : 'N/A',
        app.status.replace(/_/g, ' ').toUpperCase(),
        new Date(app.created_at).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['App #', 'Student Name', 'School', 'Category', 'Subcategory', 'Status', 'Date Applied']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 14, 200);
        doc.text("Confidential - Scholarship Management System", 283, 200, { align: 'right' });
      }

      doc.save(`scholarship_report_${new Date().toISOString().split('T')[0]}.pdf`);
      success('PDF report generated successfully');
      setPassword(''); // Reset password after generation
    } catch (error) {
      console.error('Failed to export report:', error);
      showError('Failed to generate PDF report');
    } finally {
      setExporting(false);
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
      case 'rejection':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'pending':
      case 'draft':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'endorsed_to_ssc':
      case 'ssc_final_approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-slate-700 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Application Management Overview
            </h1>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-lg font-bold border border-blue-100/50 dark:border-blue-800/50 shadow-sm transition-all hover:shadow-md">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>S.Y. {stats.activeSchoolYear}</span>
              <span className="text-blue-300 dark:text-blue-700 mx-2">|</span>
              <span>{stats.activeSemester}</span>
            </div>
          </div>
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
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="bg-blue-600 text-white border border-transparent px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Report'}
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
      {(() => {
        const LIMIT = 5;
        const visible = showAllActivities ? recentActivities : recentActivities.slice(0, LIMIT);
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
              {recentActivities.length > LIMIT && (
                <button
                  onClick={() => setShowAllActivities(prev => !prev)}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  {showAllActivities ? 'Show less' : `Show all (${recentActivities.length})`}
                </button>
              )}
            </div>

            {visible.length > 0 ? (
              <div className="space-y-4">
                {visible.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.status)}`}>
                          {activity.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent activities found
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Export Modal */}
      {createPortal(
        <AnimatePresence>
          {showExportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Export Report
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Filter and generate a PDF report of scholarship applications.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="endorsed_to_ssc">Endorsed to SSC</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">School</label>
                      <select
                        value={filters.school_id}
                        onChange={(e) => handleFilterChange('school_id', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Schools</option>
                        {schools.map(school => (
                          <option key={school.id} value={school.id}>
                            {school.name}{school.campus ? ` - ${school.campus}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        value={filters.category_id}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory</label>
                      <select
                        value={filters.subcategory_id}
                        onChange={(e) => handleFilterChange('subcategory_id', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                        disabled={!filters.category_id || filters.category_id === 'all'}
                      >
                        <option value="all">All Subcategories</option>
                        {subcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700 mt-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Password Protection (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password to encrypt PDF"
                        className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Leave blank for an unprotected PDF.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Generate PDF
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </AnimatedContainer>
  );
}

export default ApplicationOverview;
