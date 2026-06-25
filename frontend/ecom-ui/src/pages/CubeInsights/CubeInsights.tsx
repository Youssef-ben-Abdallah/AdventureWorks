import React, { useState, useEffect, useMemo } from 'react';
import { CubeInsightsService } from '../../services/cubeInsights';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CubeInsights.css';

// Chart.js was used in Angular, but we will use Recharts via ChartCard and Recharts components
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export const CubeInsights = () => {
  const [activeTab, setActiveTab] = useState(0);

  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedTerritory, setSelectedTerritory] = useState('All');

  const [years, setYears] = useState<string[]>([]);
  const [territories, setTerritories] = useState<string[]>([]);

  const [kpis, setKpis] = useState<any>({
    grossProfitMargin: 0,
    aov: 0,
    discountRatio: 0,
    effectiveTaxRate: 0
  });

  const [profitData, setProfitData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [territorySales, setTerritorySales] = useState<any[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedTerritory]);

  const loadFilters = async () => {
    try {
      const res = await CubeInsightsService.getFilters();
      setYears(res.years || []);
      setTerritories(res.territories || []);
      if (res.years && res.years.length > 0 && selectedYear === 'All') {
        setSelectedYear(res.years[res.years.length - 1]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    const params: any = {};
    if (selectedYear !== 'All') params.year = selectedYear;
    if (selectedTerritory !== 'All') params.territory = selectedTerritory;

    try {
      const [k, p, t, tp, ts] = await Promise.all([
        CubeInsightsService.getKpis(params),
        CubeInsightsService.getProfitAnalysis(params),
        CubeInsightsService.getSalesTrend(params),
        CubeInsightsService.getTopProducts(params),
        CubeInsightsService.getTerritorySales(params)
      ]);
      setKpis(k);
      setProfitData(p || []);
      setTrendData(t || []);
      setTopProducts(tp || []);
      setTerritorySales(ts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const formatPercent = (v: number) => {
    return new Intl.NumberFormat(undefined, { style: 'percent', minimumFractionDigits: 2 }).format(v || 0);
  };
  const formatMoney = (v: number) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v || 0);
  };

  const mapCoords: Record<string, [number, number]> = {
    'North America': [40, -100],
    'Europe': [50, 10],
    'Pacific': [-25, 135],
    'Australia': [-25, 135],
    'United States': [38, -97],
    'Canada': [56, -106],
    'France': [46, 2],
    'Germany': [51, 9],
    'United Kingdom': [53, -2],
    'Southwest': [33, -112],
    'Northwest': [45, -120],
    'Central': [39, -98],
    'Southeast': [33, -83],
    'Northeast': [42, -73]
  };

  const maxSales = useMemo(() => {
    return Math.max(...territorySales.map(t => t.sales || 0), 1);
  }, [territorySales]);

  return (
    <div className="ci-shell">
      {/* HEADER */}
      <div className="ci-header">
        <div className="ci-header-left">
          <div className="h">
            <span className="material-icons header-icon">auto_awesome</span>
            Reseller Analytics Hub
          </div>
          <div className="sub">Powered by Multidimensional SSAS Cube — explore KPIs, product performance & territory sales</div>
        </div>

        <div className="ci-filters">
          <div className="filter-item">
            <label>Calendar Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Sales Territory</label>
            <select value={selectedTerritory} onChange={e => setSelectedTerritory(e.target.value)}>
              <option value="All">All</option>
              {territories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="tabs-container ci-tabs">
        <div className="tabs-header">
          {['Overview', 'Product Insights', 'Territory Map'].map((name, i) => {
            const icons = ['dashboard', 'inventory_2', 'public'];
            return (
              <button key={i} className={`tab-button ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                <span className="material-icons tab-icon">{icons[i]}</span>
                {name}
              </button>
            );
          })}
        </div>

        <div className="tab-content" style={{ marginTop: '1.5rem' }}>
          {/* OVERVIEW */}
          <div style={{ display: activeTab === 0 ? 'block' : 'none' }}>
            {/* KPI Cards */}
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-purple"><span className="material-icons">query_stats</span></div>
                <div className="kpi-info">
                  <h3>Gross Profit Margin</h3>
                  <p className="kpi-value">{formatPercent(kpis.grossProfitMargin)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue"><span className="material-icons">payments</span></div>
                <div className="kpi-info">
                  <h3>Average Order Value</h3>
                  <p className="kpi-value">{formatMoney(kpis.aov)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-pink"><span className="material-icons">local_offer</span></div>
                <div className="kpi-info">
                  <h3>Discount Ratio</h3>
                  <p className="kpi-value">{formatPercent(kpis.discountRatio)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-cyan"><span className="material-icons">account_balance</span></div>
                <div className="kpi-info">
                  <h3>Effective Tax Rate</h3>
                  <p className="kpi-value">{formatPercent(kpis.effectiveTaxRate)}</p>
                </div>
              </div>
            </section>

            {/* Charts */}
            <section className="charts-grid">
              {/* Trend Chart (Line + Line) */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Monthly Sales & Profit Trend</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: any) => formatMoney(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="sales" name="Sales Amount" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profit Chart (Bar + Line) */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Profitability by Category</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profitData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: any) => formatMoney(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="grossProfit" name="Gross Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* PRODUCT INSIGHTS */}
          <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
            <section className="charts-grid">
              <div className="chart-card glass" style={{ height: '600px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Top 10 Products by Revenue</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart layout="vertical" data={topProducts} margin={{ top: 10, right: 30, left: 80, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <YAxis type="category" dataKey="product" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: any) => formatMoney(value)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* TERRITORY MAP */}
          <div style={{ display: activeTab === 2 ? 'block' : 'none', position: 'relative', height: '600px', width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
            <div className="chart-card map-card glass" style={{ height: '100%', padding: 0 }}>
              <div className="chart-header" style={{ padding: '1.5rem', marginBottom: 0, background: 'rgba(15,23,42,0.8)' }}>
                <h2 className="chart-title" style={{ fontSize: '1.25rem' }}>Global Territory Sales Map</h2>
              </div>
              <div style={{ flex: 1, height: 'calc(100% - 70px)' }}>
                {activeTab === 2 && (
                  <MapContainer center={[30, 0]} zoom={2} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {territorySales.filter(t => t.region && mapCoords[t.region]).map((t, idx) => {
                      const coord = mapCoords[t.region];
                      const radius = Math.max(8, (t.sales / maxSales) * 30);
                      return (
                        <CircleMarker
                          key={idx}
                          center={coord}
                          radius={radius}
                          color="#f43f5e"
                          fillColor="#f43f5e"
                          fillOpacity={0.6}
                          weight={2}
                        >
                          <LeafletTooltip>
                            <b>{t.region}</b><br/>
                            Sales: {formatMoney(t.sales)}
                          </LeafletTooltip>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
