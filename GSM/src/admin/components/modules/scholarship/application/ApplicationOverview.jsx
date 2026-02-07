import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { showSuccess, showError } = useToastContext();
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
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchOverviewData();
  }, []);

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
      const data = await scholarshipApiService.getApplicationsReportData();

      if (!data || data.length === 0) {
        showError('No applications found to export');
        return;
      }

      // Dynamically import jsPDF to avoid bundling issues
      const jspdfModule = await import('jspdf');

      // Try multiple ways to get the constructor based on how Vite bundles it
      let JsPDFConstructor;
      if (typeof jspdfModule.jsPDF === 'function') {
        JsPDFConstructor = jspdfModule.jsPDF;
      } else if (typeof jspdfModule.default === 'function') {
        JsPDFConstructor = jspdfModule.default;
      } else if (jspdfModule.default && typeof jspdfModule.default.jsPDF === 'function') {
        JsPDFConstructor = jspdfModule.default.jsPDF;
      } else if (jspdfModule.default && typeof jspdfModule.default.default === 'function') {
        JsPDFConstructor = jspdfModule.default.default;
      } else {
        throw new Error('Failed to locate jsPDF constructor');
      }

      // Import autotable plugin and get the function
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule.applyPlugin || autoTableModule;

      // Configure PDF options, including encryption if password is provided
      const pdfOptions = { orientation: 'landscape' };
      if (password) {
        pdfOptions.encryption = {
          userPassword: password,
          ownerPassword: password,
          userPermissions: ["print", "modify", "copy", "annot-forms"]
        };
      }

      const doc = new JsPDFConstructor(pdfOptions);

      // Apply plugin if it's a function that needs to be applied
      if (typeof autoTable === 'function' && !doc.autoTable) {
        try {
          autoTable.default?.(doc) || autoTable(doc);
        } catch (e) {
          console.log('autoTable plugin application attempt:', e.message);
        }
      }

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
        app.school ? app.school.name : 'N/A',
        app.category ? app.category.name : 'N/A',
        app.subcategory ? app.subcategory.name : 'N/A',
        app.status.replace(/_/g, ' ').toUpperCase(),
        new Date(app.created_at).toLocaleDateString()
      ]);

      // Use the imported autoTable function
      autoTable(doc, {
        startY: 45,
        head: [['App #', 'Student Name', 'School', 'Category', 'Subcategory', 'Status', 'Date Applied']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
        styles: { fontSize: 8 },
        columnStyles: {
          1: { cellWidth: 'auto' }, // Student Name
          2: { cellWidth: 'auto' }  // School
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
      showSuccess('PDF report generated successfully');
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
        </div>

        {recentActivities.length > 0 ? (
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
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
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

                <div className="p-6 space-y-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Generate a PDF report of all current scholarship applications.
                  </p>

                  <div className="space-y-2">
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

                  <div className="pt-4 flex justify-end gap-3">
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
