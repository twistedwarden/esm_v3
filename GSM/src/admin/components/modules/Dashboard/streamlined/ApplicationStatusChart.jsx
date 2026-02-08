import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ApplicationStatusChart = ({ data }) => {
    const trends = data?.monthly || [];

    if (!trends || trends.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Application Trends</h3>
                <p className="text-gray-500 text-sm">No trend data available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">Application Trends</h3>
                <p className="text-sm text-gray-500">Monthly application and approval volume</p>
            </div>

            <div className="flex-1 min-h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={trends}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                            type="monotone"
                            dataKey="applications"
                            name="New Applications"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="approved"
                            name="Approved"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ApplicationStatusChart;
