import React from 'react';

const SecuritySidebar = ({ activeTab, onTabChange, items }) => {
    return (
        <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 h-fit flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Menu
                </h3>
            </div>
            <nav className="p-2 space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default SecuritySidebar;
