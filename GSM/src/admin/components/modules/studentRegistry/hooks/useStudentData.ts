import { useState, useEffect, useCallback } from 'react';
import studentApiService from '../../../../../services/studentApiService';
import { useToastContext } from '../../../../../components/providers/ToastProvider';

export type ViewMode = 'all' | 'active' | 'archived' | 'scholars' | 'non_scholars';

export interface StudentFilters {
    search: string;
    school: string;
    program: string;
    year_level: string;
    scholarship_status: string;
    academic_status: string;
    campus?: string;
}

export interface PaginationState {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export const useStudentData = (viewMode: ViewMode = 'all') => {
    const { success: showSuccess, error: showError } = useToastContext();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<StudentFilters>({
        search: '',
        school: 'all',
        program: 'all',
        year_level: 'all',
        scholarship_status: 'all',
        academic_status: 'all',
        campus: 'all'
    });
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0
    });
    const [sort, setSort] = useState({ field: 'created_at', order: 'desc' });

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const apiFilters: any = {
                page: pagination.page,
                per_page: pagination.per_page,
                sort: sort.field,
                order: sort.order,
                search: filters.search
            };

            // Apply view mode constraints
            if (viewMode === 'active') {
                apiFilters.status = 'active';
            } else if (viewMode === 'archived') {
                apiFilters.status = 'archived';
            } else if (viewMode === 'scholars') {
                apiFilters.scholarship_status = 'scholar';
                apiFilters.status = 'active'; // Usually scholars are active
            } else if (viewMode === 'non_scholars') {
                apiFilters.scholarship_status = 'none'; // Or handle multiple non-scholar statuses
                // apiFilters.status = 'active'; // Optional: restricted to active?
            }

            // Apply manual filters
            if (filters.school !== 'all') apiFilters.school_name = filters.school;
            if (filters.program !== 'all') apiFilters.program = filters.program;
            if (filters.year_level !== 'all') apiFilters.year_level = filters.year_level;
            if (filters.academic_status !== 'all') apiFilters.academic_status = filters.academic_status;

            // Override scholarship status filter if set manually and not conflicting with viewMode
            if (filters.scholarship_status !== 'all' && viewMode !== 'scholars' && viewMode !== 'non_scholars') {
                apiFilters.scholarship_status = filters.scholarship_status;
            }

            const response: any = await studentApiService.getStudents(apiFilters);
            // Handle different response structures: response.data.data or response.data or response
            const studentsData = response?.data?.data || response?.data || response || [];
            const studentsArray = Array.isArray(studentsData) ? studentsData : [];

            setStudents(studentsArray);
            setPagination(prev => ({
                ...prev,
                total: response?.data?.total || response?.total || studentsArray.length || 0,
                total_pages: response?.data?.last_page || response?.last_page || Math.ceil((response?.data?.total || response?.total || studentsArray.length) / pagination.per_page) || 1
            }));
        } catch (error) {
            console.error('Error fetching students:', error);
            showError('Failed to fetch students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.per_page, sort, filters, viewMode, showError]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleFilterChange = (key: keyof StudentFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (field: string) => {
        setSort(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const refreshData = () => {
        fetchStudents();
    };

    // Bulk Actions
    const handleArchive = async (uuids: string[]) => {
        try {
            const response: any = await studentApiService.bulkArchiveStudents(uuids);
            console.log('Archive response:', response);
            if (response && response.success) {
                showSuccess(`${uuids.length} student(s) archived successfully`);
                refreshData();
            } else {
                showError(response?.message || 'Failed to archive students');
            }
        } catch (error: any) {
            console.error('Error bulk archiving students:', error);
            showError(error?.response?.data?.message || 'Failed to archive students');
        }
    };

    const handleRestore = async (uuids: string[]) => {
        try {
            const response: any = await studentApiService.bulkRestoreStudents(uuids);
            if (response && response.success) {
                showSuccess(`${uuids.length} student(s) restored successfully`);
                refreshData();
            } else {
                showError(response?.message || 'Failed to restore students');
            }
        } catch (error: any) {
            console.error('Error bulk restoring students:', error);
            showError(error?.response?.data?.message || 'Failed to restore students');
        }
    };

    const handleDelete = async (uuids: string[]) => {
        if (!confirm('Are you sure you want to permanently delete these students? This action cannot be undone.')) return;
        try {
            const response: any = await studentApiService.bulkForceDeleteStudents(uuids);
            if (response && response.success) {
                showSuccess(`${uuids.length} student(s) permanently deleted`);
                refreshData();
            } else {
                showError(response?.message || 'Failed to delete students');
            }
        } catch (error: any) {
            console.error('Error bulk deleting students:', error);
            showError(error?.response?.data?.message || 'Failed to delete students');
        }
    };

    return {
        students,
        loading,
        filters,
        pagination,
        sort,
        handleFilterChange,
        handlePageChange,
        handleSortChange,
        refreshData,
        handleArchive,
        handleRestore,
        handleDelete
    };
};
