import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ApplicationStatusChart = ({ data }) => {
    // Default data if none provided
    const chartData = [
        { name: 'Approved', value: data?.approved || 0, color: '#22c55e' }, // Green
        { name: 'Pending Review', value: data?.pending || 0, color: '#eab308' }, // Yellow
        { name: 'Under Review', value: data?.underReview || 0, color: '#3b82f6' }, // Blue
        { name: 'Rejected', value: data?.rejected || 0, color: '#ef4444' }  // Red
    ].filter(item => item.value > 0);

    const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

    if (total === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Application Data</h3>
                <p className="text-gray-500 text-sm">No application data available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">Application Data</h3>
                <p className="text-sm text-gray-500">Overview of application statuses</p>
            </div>

            <div className="flex-1 min-h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [value, 'Applications']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApplicationStatusChart;
