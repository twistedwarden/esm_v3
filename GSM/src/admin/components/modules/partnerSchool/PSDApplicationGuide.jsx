import React from 'react';
import { BookOpen, Mail, FileText, CheckCircle, XCircle, Clock, ArrowRight, HelpCircle } from 'lucide-react';

function PSDApplicationGuide() {
    const [activeSection, setActiveSection] = React.useState('overview');

    const sections = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'application-workflow', label: 'Application Workflow', icon: FileText },
        { id: 'status-flow', label: 'Status Flow', icon: ArrowRight },
        { id: 'documents', label: 'Document Review', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <HelpCircle className="w-8 h-8 text-orange-500" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Partner School Application Guide
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Complete navigation guide for managing partner school applications
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
                    <div className="border-b border-gray-200 dark:border-slate-700">
                        <nav className="flex space-x-8 px-6">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`
                                            flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                            ${
                                                activeSection === section.id
                                                    ? 'border-orange-500 text-orange-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{section.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    {activeSection === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    Getting Started
                                </h2>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 dark:text-blue-200">
                                        <strong>Navigation:</strong> Sidebar → Partner School Database → Applications
                                    </p>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    The Applications module manages the complete partner school application process from creation through approval.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    Key Features
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-5 h-5 text-orange-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Application Management</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Create, review, and manage partner school applications with automatic account creation
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Document Verification</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Review and verify school documents uploaded by applicants
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-5 h-5 text-yellow-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Status Tracking</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Track application progress through draft, submitted, under review, and final approval stages
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail className="w-5 h-5 text-blue-500" />
                                            <h4 className="font-semibold text-gray-900 dark:text-white">Auto Account Creation</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Automatically create partner school accounts with credentials sent via email
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'application-workflow' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Application Creation & Management Workflow
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="border-l-4 border-orange-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 1: Create New Application
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        Click <strong>"+ New Application"</strong> button (top right)
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Fill in the required information:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li>School Name (required)</li>
                                        <li>Classification (required - e.g., Public Elementary, Private High School)</li>
                                        <li>Address (City, Region, etc.)</li>
                                        <li>Contact Person Information (required)</li>
                                        <li>Email (required)</li>
                                        <li>Contact Number</li>
                                        <li>Admin Notes (optional, internal use only)</li>
                                    </ul>
                                </div>

                                <div className="border-l-4 border-blue-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 2: Auto Account Creation
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        When you save the application:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li>A partner school account is automatically created</li>
                                        <li>Temporary password is generated and emailed to the contact person</li>
                                        <li>School rep can login and upload required documents</li>
                                        <li>Application status starts as <strong>"Draft"</strong></li>
                                    </ul>
                                </div>

                                <div className="border-l-4 border-yellow-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 3: Partner School Actions
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        The partner school representative will:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li>Login with their credentials</li>
                                        <li>Upload all required documents (based on guidelines)</li>
                                        <li>Submit the application when all documents are uploaded</li>
                                        <li>Status changes from <strong>"Draft"</strong> to <strong>"Submitted"</strong></li>
                                    </ul>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 4: Admin Review & Approval
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        As an admin, you can:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li>Mark application as <strong>"Under Review"</strong></li>
                                        <li>Review all uploaded documents</li>
                                        <li><strong>"Approve"</strong> the application (sets status to Approved)</li>
                                        <li><strong>"Reject"</strong> the application with reason</li>
                                    </ul>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        Note: Partners can withdraw their application while it's <strong>"Submitted"</strong> or <strong>"Under Review"</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeSection === 'status-flow' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Application Status Flow
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Draft</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Initial status when application is created
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Action:</strong> Click "Submit for Review" to move to "Submitted"
                                    </p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Submitted</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Application has been submitted for review
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Action:</strong> Create account or wait for document upload
                                    </p>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Under Review</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Admin is reviewing the application and uploaded documents
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <strong>Actions:</strong> Review all documents, then Approve or Reject the application
                                    </p>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-orange-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Withdrawn</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Partner school withdrew their application voluntarily
                                    </p>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Approved</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Final status - School is verified and approved
                                    </p>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Rejected</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Final status - Application rejected, reason stored
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'documents' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Document Review Process
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="border-l-4 border-orange-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 1: Access Document Review
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        From Applications list, click <strong>📄 File icon</strong>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Or access from Application Details modal
                                    </p>
                                </div>

                                <div className="border-l-4 border-blue-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 2: Review Documents
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        For each document:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li>Click <strong>👁️ View</strong> to see the document</li>
                                        <li>Click <strong>⬇️ Download</strong> to download</li>
                                        <li>Review document content and validity</li>
                                    </ul>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 3: Verify Documents
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        Options available:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4">
                                        <li><strong>✅ Verify</strong> - Mark document as verified</li>
                                        <li><strong>❌ Reject</strong> - Reject document (add notes)</li>
                                        <li>Add verification notes (optional)</li>
                                    </ul>
                                </div>

                                <div className="border-l-4 border-purple-500 pl-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                        Step 4: Complete Review
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Once all documents are verified, proceed to approve/reject the application
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Reference */}
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Action Reference
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Create Application</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Click "+ New Application" button</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">View Application Details</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Click "Details" button on application card</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Review Documents</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Click "Documents" button on application card</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Mark Under Review</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">For submitted applications (yellow button)</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Approve Application</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">For under review applications (green button)</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">Reject Application</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">For under review applications (red button)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PSDApplicationGuide;
