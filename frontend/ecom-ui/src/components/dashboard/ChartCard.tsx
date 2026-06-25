import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './ChartCard.css';

interface ChartCardProps {
  title: string;
  sub: string;
  hint?: string;
  type: 'line' | 'bar' | 'doughnut';
  labels: string[];
  values: number[];
  datasetLabel?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueFormat?: 'money' | 'integer' | 'compact';
  showLegend?: boolean;
  compact?: boolean;
  className?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#84cc16', '#06b6d4'];

const formatValue = (value: number, format?: string) => {
  if (format === 'money') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'compact') {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat().format(value);
};

export const ChartCard = (props: ChartCardProps) => {
  const { title, sub, hint, type, labels, values, datasetLabel, xAxisLabel, yAxisLabel, valueFormat, showLegend, compact, className } = props;

  const data = labels.map((label, i) => ({
    name: label,
    value: values[i]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-label">{label || payload[0].name}</div>
          <div className="tooltip-value">
            {datasetLabel && <span className="tooltip-dataset">{datasetLabel}: </span>}
            {formatValue(payload[0].value, valueFormat)}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => formatValue(val, 'compact')} />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
              <Line type="monotone" dataKey="value" name={datasetLabel || 'Value'} stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => formatValue(val, 'compact')} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
              <Bar dataKey="value" name={datasetLabel || 'Value'} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={compact ? "60%" : "50%"}
                outerRadius={compact ? "80%" : "70%"}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend layout={compact ? "horizontal" : "vertical"} verticalAlign={compact ? "bottom" : "middle"} align={compact ? "center" : "right"} />}
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`chart-card glass ${compact ? 'chart-card-compact' : ''} ${className || ''}`}>
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <div className="chart-sub">{sub}</div>
        </div>
        {hint && (
          <div className="chart-hint" title={hint}>
            <span className="material-icons">info</span>
          </div>
        )}
      </div>
      <div className="chart-body">
        {renderChart()}
      </div>
    </div>
  );
};
