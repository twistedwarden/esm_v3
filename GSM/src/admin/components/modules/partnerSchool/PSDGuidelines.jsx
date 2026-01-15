import React from 'react';
import { FileText, ChevronDown, ChevronUp, Printer, Download, BookOpen, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { getGuidelines } from '../../../../services/partnerSchoolGuidelinesService';

function PSDGuidelines() {
    const [guidelines, setGuidelines] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [expandedSections, setExpandedSections] = React.useState({
        requirements: true,
        benefits: true,
        responsibilities: true,
        process: true,
    });

    const sectionIcons = {
        requirements: CheckCircle,
        benefits: Award,
        responsibilities: BookOpen,
        process: ArrowRight,
    };

    const sectionTitles = {
        requirements: 'Requirements',
        benefits: 'Benefits',
        responsibilities: 'Responsibilities',
        process: 'Application Process',
    };

    React.useEffect(() => {
        fetchGuidelines();
    }, []);

    const fetchGuidelines = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getGuidelines();
            setGuidelines(data);
        } catch (err) {
            console.error('Error fetching guidelines:', err);
            setError(err.message || 'Failed to load guidelines');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading guidelines...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={fetchGuidelines}
                        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner School Guidelines</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Requirements, benefits, responsibilities, and application process
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 max-w-5xl mx-auto">
                {/* Guidelines by Section */}
                {['requirements', 'benefits', 'responsibilities', 'process'].map((section) => {
                    const sectionGuidelines = guidelines[section] || [];
                    const Icon = sectionIcons[section];
                    const isExpanded = expandedSections[section];

                    if (sectionGuidelines.length === 0) {
                        return null;
                    }

                    return (
                        <div
                            key={section}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                        <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {sectionTitles[section]}
                                    </h2>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({sectionGuidelines.length})
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6">
                                    <div className="space-y-6">
                                        {sectionGuidelines.map((guideline) => (
                                            <div
                                                key={guideline.id}
                                                className="border-l-4 border-orange-500 pl-4 py-2"
                                            >
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {guideline.title}
                                                </h3>
                                                <div
                                                    className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{ __html: guideline.content }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Empty State */}
                {Object.keys(guidelines).length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Guidelines Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Guidelines will be displayed here once they are added by administrators.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PSDGuidelines;
