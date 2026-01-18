import React from 'react';
import { TrendingUp, Target, Users, BookOpen, Clock, CheckCircle, Award, PhilippinePeso } from 'lucide-react';

function PerformanceMetrics() {
    const metrics = [
        {
            title: 'Application Processing Time',
            current: 3.2,
            target: 2.5,
            icon: Clock,
            color: 'blue',
            trend: '-0.5 days',
            unit: 'days',
            description: 'Average processing time'
        },
        {
            title: 'Approval Rate',
            current: 71.5,
            target: 75,
            icon: CheckCircle,
            color: 'green',
            trend: '+2.3%',
            unit: '%',
            description: 'Applications approved'
        },
        {
            title: 'SSC Review Efficiency',
            current: 68,
            target: 80,
            icon: Award,
            color: 'purple',
            trend: '+5.2%',
            unit: '%',
            description: 'Reviews completed on time'
        },
        {
            title: 'Budget Utilization',
            current: 71,
            target: 85,
            icon: PhilippinePeso,
            color: 'orange',
            trend: '+8.1%',
            unit: '%',
            description: 'Scholarship funds utilized'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: 'bg-blue-500',
                light: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-600 dark:text-blue-400'
            },
            green: {
                bg: 'bg-green-500',
                light: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-600 dark:text-green-400'
            },
            purple: {
                bg: 'bg-purple-500',
                light: 'bg-purple-100 dark:bg-purple-900/30',
                text: 'text-purple-600 dark:text-purple-400'
            },
            orange: {
                bg: 'bg-orange-500',
                light: 'bg-orange-100 dark:bg-orange-900/30',
                text: 'text-orange-600 dark:text-orange-400'
            }
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Performance Metrics
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Current vs Target
                </div>
            </div>
            
            <div className="space-y-6">
                {metrics.map((metric, index) => {
                    const IconComponent = metric.icon;
                    const colorClass = getColorClasses(metric.color);
                    const percentage = (metric.current / metric.target) * 100;
                    
                    return (
                        <div key={index} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${colorClass.light}`}>
                                        <IconComponent className={`w-4 h-4 ${colorClass.text}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                            {metric.title}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            {metric.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {metric.current}{metric.unit}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {metric.trend}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${colorClass.bg} transition-all duration-500`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    <span>0{metric.unit}</span>
                                    <span>{metric.target}{metric.unit}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PerformanceMetrics; 