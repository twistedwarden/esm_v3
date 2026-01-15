import React from 'react';
import { ClipboardList, HelpCircle } from 'lucide-react';
import PSDApplicationManagement from './PSDApplicationManagement';
import PSDApplicationGuide from './PSDApplicationGuide';

function PSDApplicationsTabbed() {
    const [activeTab, setActiveTab] = React.useState('applications');

    const tabs = [
        { id: 'applications', label: 'Applications', icon: ClipboardList },
        { id: 'guide', label: 'Guide', icon: HelpCircle },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner School Applications</h1>
                <p className="text-gray-600">Manage partner school applications and verification</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                                    ${
                                        activeTab === tab.id
                                            ? 'border-green-500 text-green-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'applications' && <PSDApplicationManagement />}
                {activeTab === 'guide' && <PSDApplicationGuide />}
            </div>
        </div>
    );
}

export default PSDApplicationsTabbed;
