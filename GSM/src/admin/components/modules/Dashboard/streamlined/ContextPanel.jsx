import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ContextPanel = ({ weeklyData, upcomingInterviews }) => {
    // Transform data for Recharts
    const chartData = weeklyData.labels.map((label, index) => ({
        day: label,
        New: weeklyData.new[index],
        Approved: weeklyData.approved[index]
    }));

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Chart Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Flow</h3>
                <div className="flex-1 w-full min-h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap={2}>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="New" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> New</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Approved</div>
                </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Upcoming Interviews</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{upcomingInterviews.length} today</span>
                </div>

                <div className="space-y-3">
                    {upcomingInterviews.slice(0, 3).map((interview, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                            <div className="w-10 text-center font-bold text-gray-500 mr-3 shrink-0">
                                <div className="text-xs uppercase">{interview.time}</div>
                            </div>
                            <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-100">
                                <div className="font-medium text-gray-900 truncate">{interview.candidate}</div>
                                <div className="text-xs text-gray-500 truncate">{interview.type}</div>
                            </div>
                        </div>
                    ))}

                    {upcomingInterviews.length === 0 && (
                        <p className="text-xs text-center text-gray-400 py-4">No interviews scheduled</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContextPanel;
