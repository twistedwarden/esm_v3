import React from 'react';

function ChartCard({ title, subtitle, data, type }) {
    const renderLineChart = () => {
        if (!data || !data.labels || !data.datasets) {
            return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
        }

        const allValues = data.datasets.flatMap(dataset => dataset.data).filter(val => !isNaN(val) && val !== null && val !== undefined);
        const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
        const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
        const range = maxValue - minValue;

        return (
            <div className="h-64 flex items-end justify-between px-4 pb-4">
                {data.labels.map((label, index) => {
                    const values = data.datasets.map(dataset => dataset.data[index] || 0).filter(val => !isNaN(val));
                    const maxDatasetValue = values.length > 0 ? Math.max(...values) : 0;
                    const height = range > 0 ? ((maxDatasetValue - minValue) / range) * 200 + 20 : 120;
                    
                    return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {maxDatasetValue.toLocaleString()}
                            </div>
                            <div
                                className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                                style={{ height: `${height}px` }}
                            />
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPieChart = () => {
        if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
            return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
        }

        const dataset = data.datasets[0];
        const total = dataset.data.reduce((sum, value) => sum + value, 0);
        let currentAngle = 0;

        return (
            <div className="h-64 flex items-center justify-center">
                <div className="relative">
                    <svg width="200" height="200" className="transform -rotate-90">
                        {data.labels.map((label, index) => {
                            const value = dataset.data[index] || 0;
                            const angle = total > 0 ? (value / total) * 360 : 0;
                            const startAngle = currentAngle;
                            currentAngle += angle;

                            // Ensure we have valid numbers
                            const validStartAngle = isNaN(startAngle) ? 0 : startAngle;
                            const validCurrentAngle = isNaN(currentAngle) ? 0 : currentAngle;
                            const validAngle = isNaN(angle) ? 0 : angle;

                            const x1 = 100 + 80 * Math.cos((validStartAngle * Math.PI) / 180);
                            const y1 = 100 + 80 * Math.sin((validStartAngle * Math.PI) / 180);
                            const x2 = 100 + 80 * Math.cos((validCurrentAngle * Math.PI) / 180);
                            const y2 = 100 + 80 * Math.sin((validCurrentAngle * Math.PI) / 180);

                            const largeArcFlag = validAngle > 180 ? 1 : 0;
                            const color = dataset.backgroundColor[index] || '#3B82F6';

                            // Skip if we have invalid coordinates
                            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
                                return null;
                            }

                            return (
                                <path
                                    key={index}
                                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                    fill={color}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                {total}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Total
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ml-8 space-y-2">
                    {data.labels.map((label, index) => {
                        const value = dataset.data[index];
                        const color = dataset.backgroundColor[index] || '#3B82F6';
                        return (
                            <div key={index} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {label}
                                </span>
                                <span className="text-sm font-medium text-slate-800 dark:text-white">
                                    {value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderBarChart = () => {
        if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
            return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
        }

        const dataset = data.datasets[0];
        const allValues = dataset.data;
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const range = maxValue - minValue;

        return (
            <div className="h-64 flex items-end justify-between px-4 pb-4">
                {data.labels.map((label, index) => {
                    const value = dataset.data[index];
                    const height = range > 0 ? ((value - minValue) / range) * 200 + 20 : 120;
                    const color = dataset.backgroundColor[index] || '#3B82F6';
                    
                    return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {value.toLocaleString()}
                            </div>
                            <div
                                className="w-8 rounded-t-sm transition-all duration-300 hover:opacity-80"
                                style={{ 
                                    height: `${height}px`,
                                    backgroundColor: color
                                }}
                            />
                            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                {label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return renderLineChart();
            case 'pie':
            case 'doughnut':
                return renderPieChart();
            case 'bar':
                return renderBarChart();
            default:
                return <div className="h-64 flex items-center justify-center text-gray-500">Unsupported chart type</div>;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subtitle}
                    </p>
                </div>
            </div>
            {renderChart()}
        </div>
    );
}

export default ChartCard; 