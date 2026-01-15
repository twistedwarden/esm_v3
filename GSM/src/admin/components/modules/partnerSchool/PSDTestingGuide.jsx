import React from 'react';
import { Play, Database, Code, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

function PSDTestingGuide() {
    const [copied, setCopied] = React.useState('');

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Play className="w-8 h-8 text-orange-500" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Testing Guide
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Step-by-step guide to test the Partner School Application workflow
                    </p>
                </div>

                {/* Quick Start */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-3">
                        🚀 Quick Start - Create Test Data
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Database className="w-5 h-5 text-blue-600 mt-1" />
                            <div className="flex-1">
                                <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                                    Option 1: Run Database Seeder (Easiest)
                                </p>
                                <div className="bg-white dark:bg-slate-800 rounded p-3 mb-2">
                                    <code className="text-sm text-gray-800 dark:text-gray-200">
                                        cd microservices/scholarship_service<br />
                                        php artisan db:seed --class=PartnerSchoolApplicationTestSeeder
                                    </code>
                                </div>
                                <button
                                    onClick={() => copyToClipboard('cd microservices/scholarship_service\nphp artisan db:seed --class=PartnerSchoolApplicationTestSeeder', 'seeder')}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    {copied === 'seeder' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copy Command
                                </button>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This will create 3 email applications and 6 test applications with different statuses
                            </p>
                        </div>
                    </div>
                </div>

                {/* Testing Steps */}
                <div className="space-y-6">
                    {/* Test 1 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                1
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Test Email Applications
                            </h2>
                        </div>
                        <div className="space-y-3 ml-11">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Go to <strong>Applications → Email Applications</strong> tab
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You should see 3 test emails with different statuses
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>👁️ Eye icon</strong> on "Received" email
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Verify email details are displayed correctly
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>"Create Application"</strong> on "Received" email
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Status should change to "Processed"
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>"Create Account"</strong> on "Processed" email
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Enter test details and verify account creation
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test 2 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                2
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Test Direct Application Creation
                            </h2>
                        </div>
                        <div className="space-y-3 ml-11">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Go to <strong>Applications → Applications</strong> tab
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You should see 6 test applications with different statuses
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>"+ New Application"</strong> button
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Fill form and create a new application
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>👁️ Eye icon</strong> on "Draft" application
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Click "Submit for Review" - status should change to "Submitted"
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Test <strong>Search</strong> and <strong>Filter</strong> functionality
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Filter by status, search by school name
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test 3 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                3
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Test Document Review
                            </h2>
                        </div>
                        <div className="space-y-3 ml-11">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>📄 File icon</strong> on any application
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Document Review modal should open
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Verify document list displays (may be empty if no documents uploaded)
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Documents are uploaded by school representatives after account creation
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test 4 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                4
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Test Approval/Rejection
                            </h2>
                        </div>
                        <div className="space-y-3 ml-11">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Find application with status <strong>"Under Review"</strong> or <strong>"Document Review"</strong>
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Use filter dropdown to find these applications
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>👁️ Eye icon</strong> to view details
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You should see "Approve" and "Reject" buttons
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Click <strong>"Approve"</strong> - enter notes and confirm
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Status should change to "Approved"
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Test <strong>"Reject"</strong> on another application
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Enter rejection reason and verify status changes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Testing */}
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Code className="w-6 h-6 text-orange-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            API Testing (Optional)
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Get all applications:
                            </p>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3 flex items-center justify-between">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                    GET http://localhost:8001/api/partner-school/applications
                                </code>
                                <button
                                    onClick={() => copyToClipboard('GET http://localhost:8001/api/partner-school/applications', 'api1')}
                                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                >
                                    {copied === 'api1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Get email applications:
                            </p>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3 flex items-center justify-between">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                    GET http://localhost:8001/api/partner-school/email-applications
                                </code>
                                <button
                                    onClick={() => copyToClipboard('GET http://localhost:8001/api/partner-school/email-applications', 'api2')}
                                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                >
                                    {copied === 'api2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Troubleshooting */}
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
                        ⚠️ Troubleshooting
                    </h3>
                    <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <li>• <strong>No data showing?</strong> Run the seeder command above</li>
                        <li>• <strong>API errors?</strong> Check that services are running on ports 8000 and 8001</li>
                        <li>• <strong>Authentication errors?</strong> Make sure you're logged in as admin</li>
                        <li>• <strong>Email not sending?</strong> Check SMTP configuration in .env file</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PSDTestingGuide;
