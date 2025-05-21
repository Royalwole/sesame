import { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';
import AgentLayout from '../../../components/layout/AgentLayout';
import StatsChart from '../../../components/dashboard/StatsChart';
import StatsSummary from '../../../components/dashboard/StatsSummary';
import { withAuth, withAuthGetServerSideProps } from '../../../lib/withAuth';

function StatsAnalysisPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartData, setChartData] = useState([]);
  const [previousPeriodData, setPreviousPeriodData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch historical stats data
  async function fetchStatsData() {
    try {
      setIsLoading(true);
      setError(null);

      const days = parseInt(timeRange.replace('d', ''));
      
      // Fetch current and previous period data in parallel
      const [currentRes, previousRes] = await Promise.all([
        fetch(`/api/agents/stats/historical?days=${days}`),
        fetch(`/api/agents/stats/historical?days=${days}&offset=${days}`) // Fetch previous period
      ]);

      const currentData = await currentRes.json();
      const previousData = await previousRes.json();

      if (!currentRes.ok) {
        throw new Error(currentData.error || 'Failed to fetch stats data');
      }

      if (!previousRes.ok) {
        throw new Error(previousData.error || 'Failed to fetch previous period data');
      }

      setChartData(currentData.data);
      setPreviousPeriodData(previousData.data);
    } catch (error) {
      console.error('Error fetching stats data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatsData();
  }, [timeRange]);

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/agents/stats/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-stats-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting stats:', error);
      setError('Failed to export stats');
    }
  };

  return (
    <AgentLayout title="Stats Analysis">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Stats Analysis</h1>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-wine focus:ring-wine sm:text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="180d">Last 180 days</option>
              </select>
              <button
                onClick={() => fetchStatsData()}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-wine hover:bg-wine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-wine text-sm font-medium rounded-md text-wine bg-white hover:bg-wine/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine"
              >
                <FiDownload className="mr-2" />
                Export Data
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <StatsSummary 
            data={chartData}
            previousData={previousPeriodData}
            isLoading={isLoading}
          />

          {/* Stats Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Views and Inquiries Chart */}
            <StatsChart 
              data={chartData} 
              isLoading={isLoading} 
              title="Views & Inquiries"
              series={[
                { name: 'Views', dataKey: 'views', color: '#8884d8' },
                { name: 'Inquiries', dataKey: 'inquiries', color: '#82ca9d' }
              ]}
            />

            {/* Active Listings Chart */}
            <StatsChart 
              data={chartData} 
              isLoading={isLoading}
              title="Active Listings"
              series={[
                { name: 'Active Listings', dataKey: 'activeListings', color: '#ffc658' }
              ]}
            />

            {/* Average Price Chart */}
            <StatsChart 
              data={chartData} 
              isLoading={isLoading}
              title="Average Property Price"
              series={[
                { name: 'Average Price', dataKey: 'avgPrice', color: '#ff7300' }
              ]}
              valueFormatter={(value) => `₦${value.toLocaleString()}`}
            />
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}

// Default export moved below with withAuth wrapper

// Server-side props to protect this page
export const getServerSideProps = withAuthGetServerSideProps({ role: 'agent' });

// Export wrapped component with auth protection
export default withAuth({ role: 'agent' })(StatsAnalysisPage);