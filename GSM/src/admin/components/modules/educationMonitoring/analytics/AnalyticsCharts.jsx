import React from 'react';
import { 
    AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, 
    Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-white">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ChartCard = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
        <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
        {children}
    </div>
);

const AnalyticsCharts = ({ chartData = {} }) => {
    const defaultData = {
        monthlyEnrollment: [],
        programDistribution: [],
        gpaDistribution: [],
        yearLevelDistribution: []
    };

    const data = chartData || defaultData;
    const hasData = Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);

    if (!hasData) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="text-center py-8">
                    <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
                        <BarChart3 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Analytics Data Available</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Analytics charts will appear here once student data is available. Try refreshing or adding student records.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Enrollment Trend Chart */}
            <ChartCard title="Enrollment Trends" className="lg:col-span-2">
                <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.monthlyEnrollment || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                            <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="students" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fill="url(#enrollmentGradient)" 
                                name="Students"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Program Distribution Chart */}
            <ChartCard title="Program Distribution">
                <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={data.programDistribution || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {(data.programDistribution || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36}
                                formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* GPA Distribution Chart */}
            <ChartCard title="GPA Distribution">
                <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.gpaDistribution || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={50}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="value" 
                                fill="#10b981" 
                                radius={[4, 4, 0, 0]}
                                name="Students"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Year Level Distribution Chart */}
            <ChartCard title="Year Level Distribution">
                <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={data.yearLevelDistribution || []} 
                            layout="vertical"
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" horizontal={false} />
                            <XAxis 
                                type="number"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <YAxis 
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="value" 
                                fill="#8b5cf6" 
                                radius={[0, 4, 4, 0]}
                                name="Students"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Gender Distribution (if available) */}
            {data.genderDistribution && data.genderDistribution.length > 0 && (
                <ChartCard title="Gender Distribution">
                    <div className="h-48 sm:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={data.genderDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {data.genderDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#ec4899' : '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            )}
        </div>
    );
};

export default AnalyticsCharts;
