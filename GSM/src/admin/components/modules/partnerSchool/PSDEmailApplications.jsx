import React from 'react';
import { Mail, Eye, UserPlus, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { getEmailApplications, createApplicationFromEmail, createSchoolAccount } from '../../../../services/partnerSchoolApplicationService';

function PSDEmailApplications() {
    const [emails, setEmails] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [selectedEmail, setSelectedEmail] = React.useState(null);
    const [showViewModal, setShowViewModal] = React.useState(false);

    React.useEffect(() => {
        fetchEmailApplications();
    }, [searchTerm, filterStatus]);

    const fetchEmailApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                search: searchTerm || undefined,
                status: filterStatus !== 'all' ? filterStatus : undefined,
            };
            const data = await getEmailApplications(params);
            setEmails(data.data || []);
        } catch (err) {
            console.error('Error fetching email applications:', err);
            setError(err.message || 'Failed to load email applications');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (email) => {
        setSelectedEmail(email);
        setShowViewModal(true);
    };

    const handleCreateApplication = async (email) => {
        // Check if application already exists
        if (email.application_id) {
            alert('Application already exists for this email. Application ID: ' + email.application_id);
            return;
        }

        if (email.status !== 'received') {
            alert('This email has already been processed. Status: ' + email.status);
            return;
        }

        if (!window.confirm(`Create application for ${email.school_name}?`)) {
            return;
        }

        try {
            await createApplicationFromEmail({
                email_id: email.id, // Send email ID to identify the specific email
                sender_email: email.sender_email,
                sender_name: email.sender_name,
                school_name: email.school_name,
                email_content: email.email_content,
            });
            fetchEmailApplications(); // Refresh the list
            alert('Application created successfully');
        } catch (err) {
            console.error('Error creating application:', err);
            if (err.message.includes('already exists')) {
                alert('Application already exists for this email. Refreshing list...');
                fetchEmailApplications();
            } else {
                setError(err.message || 'Failed to create application');
                alert('Error: ' + (err.message || 'Failed to create application'));
            }
        }
    };

    const handleCreateAccount = async (email) => {
        if (!email.application_id) {
            alert('Please create an application first');
            return;
        }

        const emailAddr = prompt('School contact email:');
        const firstName = prompt('Contact first name:');
        const lastName = prompt('Contact last name:');
        const contactNumber = prompt('Contact number (optional):');

        if (emailAddr && firstName && lastName) {
            try {
                await createSchoolAccount(email.application_id, {
                    email: emailAddr,
                    first_name: firstName,
                    last_name: lastName,
                    contact_number: contactNumber,
                });
                fetchEmailApplications();
                alert('Account created successfully. Credentials sent via email.');
            } catch (err) {
                console.error('Error creating account:', err);
                setError(err.message || 'Failed to create account');
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
            processed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
            account_created: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
        };
        return colors[status] || colors.received;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'account_created':
                return <CheckCircle className="w-4 h-4" />;
            case 'processed':
                return <Clock className="w-4 h-4" />;
            default:
                return <Mail className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Applications</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Manage partner school applications received via email
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="received">Received</option>
                            <option value="processed">Processed</option>
                            <option value="account_created">Account Created</option>
                        </select>
                    </div>
                </div>

                {/* Email List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading email applications...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded ${getStatusColor(email.status)}`}>
                                                {getStatusIcon(email.status)}
                                                <span className="ml-1 capitalize">{email.status.replace('_', ' ')}</span>
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {email.school_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            <strong>From:</strong> {email.sender_name} ({email.sender_email})
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Received: {new Date(email.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleView(email)}
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        {email.status === 'received' && !email.application_id && (
                                            <button
                                                onClick={() => handleCreateApplication(email)}
                                                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                                            >
                                                Create Application
                                            </button>
                                        )}
                                        {email.application_id && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                App ID: {email.application_id}
                                            </span>
                                        )}
                                        {email.status === 'processed' && email.application_id && (
                                            <button
                                                onClick={() => handleCreateAccount(email)}
                                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                                            >
                                                <UserPlus className="w-4 h-4 inline mr-1" />
                                                Create Account
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {emails.length === 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Email Applications
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Email applications will appear here once received.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* View Email Modal */}
            {showViewModal && selectedEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Details</h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">School Name</h3>
                                <p className="text-gray-700 dark:text-gray-300">{selectedEmail.school_name}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sender</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    {selectedEmail.sender_name} ({selectedEmail.sender_email})
                                </p>
                            </div>
                            {selectedEmail.email_content && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Content</h3>
                                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {selectedEmail.email_content}
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h3>
                                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedEmail.status)}`}>
                                    {getStatusIcon(selectedEmail.status)}
                                    <span className="ml-1 capitalize">{selectedEmail.status.replace('_', ' ')}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PSDEmailApplications;
