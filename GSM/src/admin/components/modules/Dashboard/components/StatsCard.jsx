import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function StatsCard({ title, value, change, changeType, icon: Icon, color, subtitle }) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            icon: 'text-green-600 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800',
            iconBg: 'bg-green-100 dark:bg-green-900/40'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            icon: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            icon: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800',
            iconBg: 'bg-orange-100 dark:bg-orange-900/40'
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            icon: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-200 dark:border-yellow-800',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            icon: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40'
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            icon: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/40'
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-900/20',
            icon: 'text-pink-600 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-800',
            iconBg: 'bg-pink-100 dark:bg-pink-900/40'
        }
    };

    const colorClass = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {subtitle}
                        </p>
                    )}
                    <div className="flex items-center">
                        {changeType === 'positive' ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                            changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {change}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                            vs last month
                        </span>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${colorClass.iconBg}`}>
                    <Icon className={`w-6 h-6 ${colorClass.icon}`} />
                </div>
            </div>
        </div>
    );
}

export default StatsCard; 