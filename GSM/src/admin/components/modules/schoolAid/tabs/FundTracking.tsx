import React, { useState, useEffect } from 'react';
import { 
  PhilippinePeso, 
  TrendingUp,
  AlertCircle,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const FundTracking = () => {
  const [fundSources, setFundSources] = useState({
    government: 0,
    partner: 0,
    special: 0,
  });
  const [allocations, setAllocations] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFundData();
  }, []);

  const fetchFundData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Mock data
      setFundSources({
        government: 10500000,
        partner: 3200000,
        special: 1800000,
      });

      setAllocations([
        {
          id: 1,
          school: 'University of the Philippines',
          allocated: 2500000,
          disbursed: 2000000,
          remaining: 500000,
          scholars: 50,
        },
        {
          id: 2,
          school: 'Ateneo de Manila University',
          allocated: 1890000,
          disbursed: 1500000,
          remaining: 390000,
          scholars: 38,
        },
        {
          id: 3,
          school: 'De La Salle University',
          allocated: 1680000,
          disbursed: 1200000,
          remaining: 480000,
          scholars: 34,
        },
        {
          id: 4,
          school: 'University of Santo Tomas',
          allocated: 980000,
          disbursed: 800000,
          remaining: 180000,
          scholars: 20,
        },
        {
          id: 5,
          school: 'Polytechnic University of the Philippines',
          allocated: 850000,
          disbursed: 700000,
          remaining: 150000,
          scholars: 17,
        },
      ]);

      setTimeline([
        {
          id: 1,
          type: 'received',
          description: 'Government Fund - Q4 2024',
          amount: 5000000,
          date: '2024-10-01',
        },
        {
          id: 2,
          type: 'disbursed',
          description: 'Batch Payment - UP (25 scholars)',
          amount: -1250000,
          date: '2024-10-10',
        },
        {
          id: 3,
          type: 'disbursed',
          description: 'Batch Payment - Ateneo (15 scholars)',
          amount: -750000,
          date: '2024-10-11',
        },
        {
          id: 4,
          type: 'scheduled',
          description: 'Scheduled Disbursement - DLSU',
          amount: -980000,
          date: '2024-10-20',
        },
        {
          id: 5,
          type: 'scheduled',
          description: 'Expected Fund - Partner Program',
          amount: 2000000,
          date: '2024-11-01',
        },
      ]);

      setAlerts([
        {
          id: 1,
          type: 'warning',
          message: 'Fund balance approaching threshold (20% remaining)',
          priority: 'medium',
        },
        {
          id: 2,
          type: 'info',
          message: 'Scheduled disbursement in 5 days - ₱2,450,000',
          priority: 'low',
        },
      ]);
    } catch (error) {
      console.error('Error fetching fund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalAvailable = fundSources.government + fundSources.partner + fundSources.special;
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const totalDisbursed = allocations.reduce((sum, a) => sum + a.disbursed, 0);
  const totalRemaining = allocations.reduce((sum, a) => sum + a.remaining, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-500' 
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <p className="text-sm font-medium text-gray-900">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fund Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Funds</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Government Fund</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(fundSources.government)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Partner Fund</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(fundSources.partner)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Special Programs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(fundSources.special)}
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-gray-200 pl-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <PhilippinePeso className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Total Available</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(totalAvailable)}
            </p>
          </div>
        </div>
      </div>

      {/* Fund Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Allocated</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAllocated)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((totalAllocated / totalAvailable) * 100).toFixed(1)}% of available funds
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Disbursed</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDisbursed)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((totalDisbursed / totalAllocated) * 100).toFixed(1)}% of allocated
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Remaining Balance</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRemaining)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Pending disbursement
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Allocation by School */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fund Allocation by School</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scholars
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disbursed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocations.map((allocation) => {
                const progress = (allocation.disbursed / allocation.allocated) * 100;
                return (
                  <tr key={allocation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {allocation.school}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {allocation.scholars}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(allocation.allocated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(allocation.disbursed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                      {formatCurrency(allocation.remaining)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 min-w-[45px]">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {allocations.reduce((sum, a) => sum + a.scholars, 0)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(totalAllocated)}
                </td>
                <td className="px-6 py-4 text-sm text-green-600">
                  {formatCurrency(totalDisbursed)}
                </td>
                <td className="px-6 py-4 text-sm text-purple-600">
                  {formatCurrency(totalRemaining)}
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Fund Flow Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fund Flow Timeline</h3>
        
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${
                  event.type === 'received' ? 'bg-green-100' :
                  event.type === 'disbursed' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {event.type === 'received' ? (
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  ) : event.type === 'disbursed' ? (
                    <ArrowDownRight className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Calendar className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(event.date)}</p>
                  </div>
                  <div className={`text-sm font-bold ${
                    event.amount > 0 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {event.amount > 0 ? '+' : ''}{formatCurrency(event.amount)}
                  </div>
                </div>
                {event.type === 'scheduled' && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    Scheduled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundTracking;

