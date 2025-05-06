import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function StatsSummary({ data, previousData, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate period totals and trends
  const calculateStats = (metricName) => {
    const currentTotal = data.reduce((sum, day) => sum + (day[metricName] || 0), 0);
    const previousTotal = previousData.reduce((sum, day) => sum + (day[metricName] || 0), 0);
    const percentChange = previousTotal === 0 ? 100 : ((currentTotal - previousTotal) / previousTotal) * 100;

    return {
      total: currentTotal,
      trend: percentChange,
      isPositive: percentChange >= 0
    };
  };

  const stats = {
    views: calculateStats('views'),
    inquiries: calculateStats('inquiries'),
    activeListings: calculateStats('activeListings'),
    avgPrice: {
      total: data.reduce((sum, day) => sum + (day.avgPrice || 0), 0) / data.length,
      trend: ((data[data.length - 1]?.avgPrice || 0) - (data[0]?.avgPrice || 0)) / (data[0]?.avgPrice || 1) * 100,
      isPositive: (data[data.length - 1]?.avgPrice || 0) >= (data[0]?.avgPrice || 0)
    }
  };

  const StatCard = ({ title, value, trend, isPositive, format = (v) => v }) => (
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      <div className="mt-1">
        <p className="text-2xl font-semibold text-gray-900">{format(value)}</p>
      </div>
      <div className="mt-2 flex items-center text-sm">
        {isPositive ? (
          <FiTrendingUp className="text-green-500 mr-1" />
        ) : (
          <FiTrendingDown className="text-red-500 mr-1" />
        )}
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-gray-500 ml-1">vs previous period</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Views"
        value={stats.views.total}
        trend={stats.views.trend}
        isPositive={stats.views.isPositive}
      />
      <StatCard
        title="Total Inquiries"
        value={stats.inquiries.total}
        trend={stats.inquiries.trend}
        isPositive={stats.inquiries.isPositive}
      />
      <StatCard
        title="Active Listings"
        value={stats.activeListings.total}
        trend={stats.activeListings.trend}
        isPositive={stats.activeListings.isPositive}
      />
      <StatCard
        title="Average Price"
        value={stats.avgPrice.total}
        trend={stats.avgPrice.trend}
        isPositive={stats.avgPrice.isPositive}
        format={(value) => `₦${value.toLocaleString()}`}
      />
    </div>
  );
}