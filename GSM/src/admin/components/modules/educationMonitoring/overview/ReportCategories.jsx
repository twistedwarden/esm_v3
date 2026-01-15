import React from 'react';
import { FileBarChart, BookOpen, Users, TrendingUp, Award, ChevronRight } from 'lucide-react';

const ReportCategories = ({ selectedCategory, onCategoryChange, allReports }) => {
    const reportCategories = [
        { 
            id: 'all', 
            label: 'All Reports', 
            count: allReports.length, 
            icon: FileBarChart,
            color: 'slate'
        },
        { 
            id: 'academic', 
            label: 'Academic', 
            count: allReports.filter(r => r.categoryId === 'academic').length, 
            icon: BookOpen,
            color: 'blue'
        },
        { 
            id: 'enrollment', 
            label: 'Enrollment', 
            count: allReports.filter(r => r.categoryId === 'enrollment').length, 
            icon: Users,
            color: 'green'
        },
        { 
            id: 'progress', 
            label: 'Progress', 
            count: allReports.filter(r => r.categoryId === 'progress').length, 
            icon: TrendingUp,
            color: 'purple'
        },
        { 
            id: 'achievements', 
            label: 'Achievements', 
            count: allReports.filter(r => r.categoryId === 'achievements').length, 
            icon: Award,
            color: 'amber'
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Categories</h3>
            </div>
            <div className="p-2">
                {reportCategories.map((category) => {
                    const IconComponent = category.icon;
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                        <button 
                            key={category.id} 
                            onClick={() => onCategoryChange(category.id)} 
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all duration-150 ${
                                isSelected 
                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 shadow-sm' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-md ${
                                    isSelected 
                                        ? 'bg-orange-100 dark:bg-orange-900/30' 
                                        : 'bg-slate-100 dark:bg-slate-700'
                                }`}>
                                    <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-medium truncate">{category.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    isSelected 
                                        ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400'
                                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                }`}>
                                    {category.count}
                                </span>
                                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-orange-400" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportCategories;
