import React from 'react';
import { 
    UserPlus, 
    FileText, 
    Award, 
    AlertCircle,
    CheckCircle,
    Clock,
    Calendar,
    DollarSign,
    XCircle
} from 'lucide-react';

function RecentActivities({ activities = [] }) {
    const getColorClasses = (color) => {
        const colors = {
            'text-green-600': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            'text-blue-600': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            'text-purple-600': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            'text-orange-600': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            'text-red-600': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        };
        return colors[color] || colors['text-blue-600'];
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activities
                </h3>
                <button 
                    onClick={() => window.location.hash = '#audit-logs'}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    View All
                </button>
            </div>
            
            <div className="space-y-4">
                {activities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}>
                                <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {activity.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.description}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {activity.timestamp}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default RecentActivities; 