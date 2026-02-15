import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import StudentStats from './components/StudentStats';
import StudentFormModal from './components/StudentFormModal';
import { useToastContext } from '../../../../components/providers/ToastProvider';

// Mock data for Line Chart
const registrationData = [
    { name: 'Jan', students: 65 },
    { name: 'Feb', students: 59 },
    { name: 'Mar', students: 80 },
    { name: 'Apr', students: 81 },
    { name: 'May', students: 56 },
    { name: 'Jun', students: 55 },
    { name: 'Jul', students: 40 },
];

// Mock data for Pie Chart
const programData = [
    { name: 'BS IT', value: 400 },
    { name: 'BS CS', value: 300 },
    { name: 'BS IS', value: 300 },
    { name: 'BS ECE', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface OverviewProps {
    onPageChange?: (id: string, tabId?: string) => void;
}

const Overview: React.FC<OverviewProps> = () => {
    const { showSuccess } = useToastContext();
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Registry Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        System snapshot and analytics
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <StudentStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart - Registration Trends */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Registration Trends</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={registrationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#64748B' }}
                                    axisLine={{ stroke: '#E2E8F0' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#64748B' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="students"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Student Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Student Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={programData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {programData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <StudentFormModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    showSuccess('Student added successfully');
                }}
            />
        </div>
    );
};

export default Overview;
