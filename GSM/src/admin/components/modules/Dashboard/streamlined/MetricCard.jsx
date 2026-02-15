import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const MetricCard = ({ label, value, subtext, status = 'neutral', trend = null, icon: Icon, onClick }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'good': return 'text-green-600 bg-green-50 border-green-200';
            case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-white border-gray-200';
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all duration-200 ${getStatusColor()} flex flex-col justify-between h-32 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''}`}
        >
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium opacity-80 uppercase tracking-wide">{label}</span>
                {Icon && <Icon className="w-5 h-5 opacity-60" />}
            </div>

            <div className="mt-2">
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                {(subtext || trend) && (
                    <div className="flex items-center mt-1 space-x-2 text-sm opacity-80">
                        {getTrendIcon()}
                        <span>{subtext}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
