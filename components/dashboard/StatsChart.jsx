import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function StatsChart({ 
  data, 
  isLoading, 
  title,
  series = [],
  valueFormatter = (value) => value
}) {
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="animate-pulse bg-gray-100 rounded-lg h-80"></div>
      </div>
    );
  }

  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {new Date(label).toLocaleDateString()}
        </p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}: {valueFormatter(item.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={valueFormatter}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                name={s.name}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}