import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { StudentFilters as FilterState } from '../hooks/useStudentData';
import studentApiService from '../../../../../services/studentApiService';

interface StudentFiltersProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: string) => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({ filters, onFilterChange }) => {
    const [showAdvanced, setShowFilters] = useState(false);
    const [options, setOptions] = useState<any>({
        programs: [],
        schools: [],
        year_levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
        scholarship_statuses: ['scholar', 'applicant', 'none'],
        statuses: ['active', 'inactive', 'archived']
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await studentApiService.getFilterOptions();
                if (response?.data) {
                    setOptions(prev => ({ ...prev, ...response.data }));
                }
            } catch (error: any) {
                // API endpoint may not exist (404), use default options
                // The service already returns default options on error, so we can ignore this
                if (error?.response?.status !== 404) {
                    console.error('Failed to fetch filter options:', error);
                }
            }
        };
        fetchOptions();
    }, []);

    const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length - (filters.search ? 1 : 0);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or email..."
                        value={filters.search}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showAdvanced)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        showAdvanced || activeFiltersCount > 0
                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                        <select
                            value={filters.school}
                            onChange={(e) => onFilterChange('school', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                        >
                            <option value="all">All Schools</option>
                            {options.schools?.map((school: any) => (
                                <option key={school.id || school} value={school.name || school}>
                                    {school.name || school}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Program</label>
                        <select
                            value={filters.program}
                            onChange={(e) => onFilterChange('program', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                        >
                            <option value="all">All Programs</option>
                            {options.programs?.map((program: any) => (
                                <option key={program} value={program}>{program}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Year Level</label>
                        <select
                            value={filters.year_level}
                            onChange={(e) => onFilterChange('year_level', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                        >
                            <option value="all">All Levels</option>
                            {options.year_levels?.map((level: string) => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Scholarship</label>
                        <select
                            value={filters.scholarship_status}
                            onChange={(e) => onFilterChange('scholarship_status', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                        >
                            <option value="all">All Statuses</option>
                            {options.scholarship_statuses?.map((status: string) => (
                                <option key={status} value={status} className="capitalize">{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentFilters;
