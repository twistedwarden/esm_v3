import React, { useState } from 'react';
import {
    MoreVertical, Eye, Edit, Archive, Trash2, RotateCcw,
    CheckSquare, Square, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentData, ViewMode } from '../hooks/useStudentData';
import StudentStats from './StudentStats';
import StudentFilters from './StudentFilters';
import StudentFormModal from './StudentFormModal';
import StudentDetailModal from './StudentDetailModal';

interface StudentListProps {
    viewMode: ViewMode;
}

const StudentList: React.FC<StudentListProps> = ({ viewMode }) => {
    const {
        students, loading, filters, pagination, sort,
        handleFilterChange, handlePageChange, handleSortChange, refreshData,
        handleArchive, handleRestore, handleDelete
    } = useStudentData(viewMode);

    // Ensure students is always an array
    const studentsArray = Array.isArray(students) ? students : [];

    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStudentUuid, setSelectedStudentUuid] = useState<string | number | null>(null);
    const [editStudentData, setEditStudentData] = useState<any>(null);

    const handleSelectAll = () => {
        if (selectedStudents.size === studentsArray.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(studentsArray.map(s => s.student_uuid)));
        }
    };

    const handleSelectStudent = (uuid: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(uuid)) {
            newSelected.delete(uuid);
        } else {
            newSelected.add(uuid);
        }
        setSelectedStudents(newSelected);
    };

    const handleBulkAction = (action: 'archive' | 'restore' | 'delete') => {
        const uuids = Array.from(selectedStudents);
        if (action === 'archive') handleArchive(uuids);
        if (action === 'restore') handleRestore(uuids);
        if (action === 'delete') handleDelete(uuids);
        setSelectedStudents(new Set());
    };

    const openEditModal = (student: any) => {
        setEditStudentData(student);
        setShowFormModal(true);
    };

    const openDetailModal = (uuid: string | number) => {
        setSelectedStudentUuid(uuid);
        setShowDetailModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {viewMode === 'all' ? 'Student Registry' : `${viewMode} Students`}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage and view student records
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditStudentData(null);
                        setShowFormModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    Add Student
                </button>
            </div>

            <StudentStats />

            <StudentFilters filters={filters} onFilterChange={handleFilterChange} />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedStudents.size > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-800"
                        >
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {selectedStudents.size} selected
                            </span>
                            <div className="flex gap-2">
                                {viewMode !== 'archived' && (
                                    <button
                                        onClick={() => handleBulkAction('archive')}
                                        className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50"
                                    >
                                        Archive
                                    </button>
                                )}
                                {viewMode === 'archived' && (
                                    <>
                                        <button
                                            onClick={() => handleBulkAction('restore')}
                                            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('delete')}
                                            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50"
                                        >
                                            Delete Permanently
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-10">
                                    <button onClick={handleSelectAll} className="flex items-center text-gray-400 hover:text-gray-600">
                                        {selectedStudents.size === studentsArray.length && studentsArray.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSortChange('last_name')}>
                                    Student
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : studentsArray.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                studentsArray.map((student, index) => (
                                    <tr
                                        key={`student-${student.student_uuid || student.id || index}`}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                                        onClick={() => openDetailModal(student.student_uuid || student.id)}
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleSelectStudent(student.student_uuid || student.id)}>
                                                {selectedStudents.has(student.student_uuid || student.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-blue-500" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.email || student.email_address || 'No Email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                                            {student.student_number || student.student_id_number || student.id_number || 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {student.program || student.current_academic_record?.program || student.course || 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {student.year_level || student.current_academic_record?.year_level || student.year || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${(student.status || (student.is_currently_enrolled ? 'active' : 'inactive')) === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        (student.status || (student.deleted_at ? 'archived' : 'inactive')) === 'archived' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {student.status || (student.is_currently_enrolled ? 'Active' : 'Inactive')}
                                                </span>
                                                {(student.scholarship_status || 'none') !== 'none' && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {student.scholarship_status || 'None'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openDetailModal(student.student_uuid || student.id)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-slate-700"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded dark:hover:bg-slate-700"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {viewMode === 'archived' ? (
                                                    <button
                                                        onClick={() => handleRestore([student.student_uuid || student.id])}
                                                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded dark:hover:bg-slate-700"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive([student.student_uuid || student.id])}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded dark:hover:bg-slate-700"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={pagination.page === pagination.total_pages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <StudentFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                initialData={editStudentData}
                onSuccess={refreshData}
            />

            <StudentDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                studentUuid={selectedStudentUuid}
                onEdit={(student) => {
                    setShowDetailModal(false);
                    openEditModal(student);
                }}
            />
        </div>
    );
};

export default StudentList;
