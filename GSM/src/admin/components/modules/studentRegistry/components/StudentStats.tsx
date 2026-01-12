import React, { useEffect, useState } from 'react';
import { Users, Award, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import studentApiService from '../../../../../services/studentApiService';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: string;
    description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, description }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-all hover:shadow-md"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
                {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
            </div>
            <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
                <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">{trend}</span>
                <span className="text-gray-400 ml-1">vs last month</span>
            </div>
        )}
    </motion.div>
);

const StudentStats: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await studentApiService.getStudentStatistics();
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl" />
            ))}
        </div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="Total Students"
                value={stats?.total_students?.toLocaleString() || '0'}
                icon={Users}
                color="blue"
                description="Active registered students"
            />
            <StatCard
                title="Active Scholars"
                value={stats?.active_scholars?.toLocaleString() || '0'}
                icon={Award}
                color="green"
                description="Currently receiving aid"
            />
            <StatCard
                title="Applicants"
                value={stats?.applicants?.toLocaleString() || '0'}
                icon={UserCheck}
                color="orange"
                description="Pending applications"
            />
            <StatCard
                title="At Risk"
                value={stats?.at_risk || '0'} // Assuming API returns this
                icon={AlertCircle}
                color="red"
                description="Students needing attention"
            />
        </div>
    );
};

export default StudentStats;
