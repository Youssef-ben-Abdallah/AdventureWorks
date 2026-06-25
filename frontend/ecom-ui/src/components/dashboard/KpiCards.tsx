import React from 'react';
import './KpiCards.css';

export interface Kpi {
  label: string;
  value: number;
  unit: string | null;
}

const formatValue = (v: number, unit?: string | null): string => {
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (unit === 'days') return `${v.toFixed(1)} days`;
  if (unit === '$') return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  
  const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  if (!unit) return compact;
  return `${compact} ${unit}`;
};

export const KpiCards = ({ kpis }: { kpis: Kpi[] | null }) => {
  if (!kpis || !kpis.length) return null;

  return (
    <div data-testid="dashboard-kpis" className="kpi-grid">
      {kpis.map((k, i) => {
        const icons = ['bar_chart', 'shopping_cart', 'inventory_2', 'account_balance_wallet', 'local_shipping', 'leaderboard', 'people', 'groups'];
        const icon = icons[i % icons.length];
        return (
        <div key={i} className="kpi">
          <div className={`kpi-icon icon-${i % 6}`}>
            <span className="material-icons">{icon}</span>
          </div>
          <div>
            <div className="label">{k.label}</div>
            <div className="value">{formatValue(k.value, k.unit)}</div>
          </div>
          </div>
        );
      })}
    </div>
  );
};
