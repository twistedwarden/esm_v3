import React from 'react';
import { AlertCircle, Clock, ChevronRight, FileX, CheckCircle } from 'lucide-react';

const ActionCenter = ({ items = [] }) => {
    // Filter for high priority items (mock logic for now if real data lacks priority flag)
    const highPriorityItems = items.filter(item => item.priority === 'high' || item.status === 'critical').slice(0, 5);

    const getIcon = (type) => {
        switch (type) {
            case 'stale_application': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'payment_failed': return <FileX className="w-5 h-5 text-red-500" />;
            case 'verification_needed': return <AlertCircle className="w-5 h-5 text-blue-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Requires Attention</h3>
                    <p className="text-sm text-gray-500">Items that need immediate resolution</p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                    {items.length} Pending
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                        <p>All caught up! No critical issues.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="group flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                            >
                                <div className="flex-shrink-0 mr-4 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                                        <span className="text-xs text-gray-400">{item.timeAgo}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-2" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-50 bg-gray-50/50 rounded-b-xl">
                <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                    View All Action Items
                </button>
            </div>
        </div>
    );
};

export default ActionCenter;
