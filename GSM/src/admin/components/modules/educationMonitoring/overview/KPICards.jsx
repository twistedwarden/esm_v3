import React from 'react';
import { 
    Users, Activity, Award, Target, TrendingUp, BookOpen, 
    ArrowUp, ArrowDown, Minus 
} from 'lucide-react';

const KPICards = ({ academicStats, chartData = {} }) => {
    const getReportStats = () => {
        const kpis = chartData.enhancedKPIs || {};
        return [
            { 
                title: 'Total Students', 
                value: academicStats.totalStudents.toString(), 
                change: '+12.5%', 
                changeType: 'positive',
                icon: Users, 
                color: 'blue',
                gradient: 'from-blue-500 to-blue-600'
            },
            { 
                title: 'Active Students', 
                value: academicStats.activeStudents.toString(), 
                change: '+8.3%', 
                changeType: 'positive',
                icon: Activity, 
                color: 'green',
                gradient: 'from-green-500 to-green-600'
            },
            { 
                title: 'Average GPA', 
                value: academicStats.averageGPA.toString(), 
                change: '+0.2', 
                changeType: 'positive',
                icon: Award, 
                color: 'purple',
                gradient: 'from-purple-500 to-purple-600'
            },
            { 
                title: 'Completion Rate', 
                value: `${kpis.completionRate || 0}%`, 
                change: '+5.2%', 
                changeType: 'positive',
                icon: Target, 
                color: 'emerald',
                gradient: 'from-emerald-500 to-emerald-600'
            },
            { 
                title: 'Retention Rate', 
                value: `${kpis.retentionRate || 0}%`, 
                change: '+2.1%', 
                changeType: 'positive',
                icon: TrendingUp, 
                color: 'orange',
                gradient: 'from-orange-500 to-orange-600'
            },
            { 
                title: 'With Grades', 
                value: (kpis.studentsWithGrades || 0).toString(), 
                change: '+18.7%', 
                changeType: 'positive',
                icon: BookOpen, 
                color: 'indigo',
                gradient: 'from-indigo-500 to-indigo-600'
            }
        ];
    };

    const getTrendIcon = (changeType) => {
        const iconClass = "w-3 h-3";
        switch (changeType) {
            case 'positive': return <ArrowUp className={`${iconClass} text-green-500`} />;
            case 'negative': return <ArrowDown className={`${iconClass} text-red-500`} />;
            default: return <Minus className={`${iconClass} text-slate-500`} />;
        }
    };

    const getTrendTextClass = (changeType) => {
        switch (changeType) {
            case 'positive': return 'text-green-600 dark:text-green-400';
            case 'negative': return 'text-red-600 dark:text-red-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            {getReportStats().map((stat, index) => {
                const IconComponent = stat.icon;
                
                return (
                    <div 
                        key={index} 
                        className="relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-md"
                    >
                        {/* Background decoration */}
                        <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10`} />
                        
                        <div className="relative">
                            {/* Icon */}
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-sm mb-3`}>
                                <IconComponent className="w-4 h-4" />
                            </div>
                            
                            {/* Value */}
                            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                                {stat.value}
                            </p>
                            
                            {/* Title */}
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {stat.title}
                            </p>
                            
                            {/* Change Indicator */}
                            <div className="flex items-center gap-1 mt-2">
                                {getTrendIcon(stat.changeType)}
                                <span className={`text-xs font-medium ${getTrendTextClass(stat.changeType)}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KPICards;
