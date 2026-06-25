import React, { useState, useEffect, useMemo } from 'react';
import { DashboardService, DashboardQuery } from '../../services/dashboard';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { NotesPanel } from '../../components/dashboard/NotesPanel';
import './Dashboard.css';

export const Dashboard = () => {
  const [filters, setFilters] = useState<any>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState(0);

  // Filter state
  const [from, setFrom] = useState<string>('2011-01-01');
  const [to, setTo] = useState<string>('2014-12-30');
  const [territoryId, setTerritoryId] = useState<string>('');
  const [territoryGroup, setTerritoryGroup] = useState<string>('');
  const [salesPersonId, setSalesPersonId] = useState<string>('');
  const [shipMethodId, setShipMethodId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [online, setOnline] = useState<string>('');

  // Data state
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [salesTeam, setSalesTeam] = useState<any>(null);
  const [shipping, setShipping] = useState<any>(null);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSalesTeam, setLoadingSalesTeam] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadActiveTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, overview, products, customers, salesTeam, shipping]);

  const toQuery = (): DashboardQuery => {
    return {
      from: from || null,
      to: to || null,
      territoryId: territoryId || null,
      territoryGroup: territoryGroup || null,
      salesPersonId: salesPersonId || null,
      shipMethodId: shipMethodId || null,
      category: category || null,
      subCategory: subCategory || null,
      currencyCode: currencyCode || null,
      online: online === '' ? null : online === 'true'
    };
  };

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const f = await DashboardService.getFilters();
      setFilters(f);
      loadActiveTab();
    } catch (e: any) {
      setError(e?.message || 'Failed to load filters');
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleApply = () => {
    setOverview(null);
    setProducts(null);
    setCustomers(null);
    setSalesTeam(null);
    setShipping(null);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setTerritoryId('');
    setTerritoryGroup('');
    setSalesPersonId('');
    setShipMethodId('');
    setCategory('');
    setSubCategory('');
    setCurrencyCode('');
    setOnline('');
    setTimeout(() => handleApply(), 0);
  };

  const loadActiveTab = async () => {
    const q = toQuery();
    try {
      if (activeTab === 0 && !overview && !loadingOverview) {
        setLoadingOverview(true);
        const data = await DashboardService.getOverview(q);
        setOverview(data);
        setLoadingOverview(false);
      } else if (activeTab === 1 && !products && !loadingProducts) {
        setLoadingProducts(true);
        const data = await DashboardService.getProducts(q);
        setProducts(data);
        setLoadingProducts(false);
      } else if (activeTab === 2 && !customers && !loadingCustomers) {
        setLoadingCustomers(true);
        const data = await DashboardService.getCustomers(q);
        setCustomers(data);
        setLoadingCustomers(false);
      } else if (activeTab === 3 && !salesTeam && !loadingSalesTeam) {
        setLoadingSalesTeam(true);
        const data = await DashboardService.getSalesTeam(q);
        setSalesTeam(data);
        setLoadingSalesTeam(false);
      } else if (activeTab === 4 && !shipping && !loadingShipping) {
        setLoadingShipping(true);
        const data = await DashboardService.getShipping(q);
        setShipping(data);
        setLoadingShipping(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
      setLoadingOverview(false);
      setLoadingProducts(false);
      setLoadingCustomers(false);
      setLoadingSalesTeam(false);
      setLoadingShipping(false);
    }
  };

  const bdLabels = (data: any[], n = 12) => (data || []).slice(0, n).map(x => x.label);
  const bdValues = (data: any[], n = 12) => (data || []).slice(0, n).map(x => x.value);
  const spLabels = (data: any[], n = 60) => (data || []).slice(0, n).map(x => x.x);
  const spValues = (data: any[], n = 60) => (data || []).slice(0, n).map(x => x.y);

  const fmtMoney = (v: number | null | undefined) => {
    if (v == null) return '';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  };
  const fmtDate = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  };

  return (
    <div className="dashboard-shell">
      <div className="header">
        <div className="title">
          <div className="h">Analytics Dashboard</div>
          <div className="sub">Sales performance, product mix, customers, and operations.</div>
        </div>
        <div className="actions">
          <button className="btn-secondary-glass" onClick={handleClear}>Reset</button>
          <button className="btn-primary-glow" onClick={handleApply}>Apply filters</button>
        </div>
      </div>

      <div className="filters card">
        <div className={`filters-grid ${loadingFilters ? 'busy' : ''}`}>
          <div className="filter-item">
            <label>Date From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Date To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Territory</label>
            <select value={territoryId} onChange={e => setTerritoryId(e.target.value)}>
              <option value="">All</option>
              {filters?.territories?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Territory group</label>
            <select value={territoryGroup} onChange={e => setTerritoryGroup(e.target.value)}>
              <option value="">All</option>
              {filters?.territoryGroups?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Salesperson</label>
            <select value={salesPersonId} onChange={e => setSalesPersonId(e.target.value)}>
              <option value="">All</option>
              {filters?.salesPeople?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Ship method</label>
            <select value={shipMethodId} onChange={e => setShipMethodId(e.target.value)}>
              <option value="">All</option>
              {filters?.shipMethods?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All</option>
              {filters?.productCategories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Subcategory</label>
            <select value={subCategory} onChange={e => setSubCategory(e.target.value)}>
              <option value="">All</option>
              {filters?.productSubCategories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Currency</label>
            <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)}>
              <option value="">All</option>
              {filters?.currencies?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Online order</label>
            <select value={online} onChange={e => setOnline(e.target.value)}>
              <option value="">All</option>
              <option value="true">Online</option>
              <option value="false">Offline</option>
            </select>
          </div>
          {loadingFilters && <div className="spinner"><span className="material-icons rotating">sync</span></div>}
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          {['Overview', 'Products', 'Customers', 'Sales team', 'Shipping'].map((name, i) => {
            const icons = ['dashboard', 'inventory_2', 'people', 'leaderboard', 'local_shipping'];
            return (
              <button key={i} className={`tab-button ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                <span className="material-icons tab-icon">{icons[i]}</span>
                {name}
              </button>
            );
          })}
        </div>

        <div className="tab-content">
          {/* OVERVIEW */}
          {activeTab === 0 && (
            <div>
              {loadingOverview && <div className="busy"><span className="material-icons rotating">sync</span></div>}
              {overview && (
                <>
                  <KpiCards kpis={overview.kpis} />
                  <div className="grid2">
                    <ChartCard
                      title="Revenue trend" sub="Monthly revenue" type="line"
                      labels={spLabels(overview.revenueTrend)} values={spValues(overview.revenueTrend)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                    <ChartCard
                      title="Revenue by territory" sub="Geo distribution" type="bar"
                      labels={bdLabels(overview.revenueByTerritory, 12)} values={bdValues(overview.revenueByTerritory, 12)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                  </div>
                  <div className="grid2">
                    <ChartCard
                      title="Revenue by category" sub="Product mix" type="doughnut"
                      labels={bdLabels(overview.revenueByCategory, 10)} values={bdValues(overview.revenueByCategory, 10)}
                      datasetLabel="Revenue" valueFormat="money" showLegend compact
                    />
                    <ChartCard
                      title="Top products" sub="Pareto view" type="bar"
                      labels={bdLabels(overview.topProducts, 12)} values={bdValues(overview.topProducts, 12)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                  </div>
                  <NotesPanel notes={[
                    { title: 'KPI row (Revenue, Orders, Units, AOV, On-time %, Freight %)', body: 'A single glance summary. AOV = revenue / orders.' },
                    { title: 'Revenue trend', body: 'Shows seasonality and whether growth is driven by more orders, price, or mix.' },
                    { title: 'Territory breakdown', body: 'Territory + CountryRegionCode enables geo analysis.' },
                    { title: 'Category + Top products', body: 'Category identifies strategic mix shifts.' }
                  ]} />
                </>
              )}
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === 1 && (
            <div>
              {loadingProducts && <div className="busy"><span className="material-icons rotating">sync</span></div>}
              {products && (
                <>
                  <KpiCards kpis={products.kpis} />
                  <div className="grid2">
                    <ChartCard
                      title="Category / Subcategory (Top 5)" sub="Mix drill-down" type="bar"
                      labels={bdLabels(products.categoryMatrix, 20)} values={bdValues(products.categoryMatrix, 20)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                    <ChartCard
                      title="Discount bands" sub="Promo intensity" type="doughnut"
                      labels={bdLabels(products.discountBands, 6)} values={bdValues(products.discountBands, 6)}
                      datasetLabel="Revenue" valueFormat="money" showLegend compact
                    />
                  </div>
                  <div className="card">
                    <div className="title">Product performance table (Top 10)</div>
                    <div className="tablewrap">
                      <table className="aw-table">
                        <thead>
                          <tr><th>Product</th><th>Category</th><th className="right">Units</th><th className="right">Revenue</th><th className="right">Est. Margin %</th></tr>
                        </thead>
                        <tbody>
                          {products.scatter?.map((r: any, i: number) => (
                            <tr key={i}>
                              <td>{r.productName}</td><td>{r.category}</td><td className="right">{r.units}</td>
                              <td className="right">{fmtMoney(r.revenue)}</td><td className="right">{r.marginPct?.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <NotesPanel notes={[
                    { title: 'Category/Subcategory matrix', body: 'A drill path view.' },
                    { title: 'Discount bands', body: 'Shows whether revenue is being bought via discounts.' },
                    { title: 'Product performance', body: 'Units vs Margin vs Revenue bubble proxy.' }
                  ]} />
                </>
              )}
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === 2 && (
            <div>
              {loadingCustomers && <div className="busy"><span className="material-icons rotating">sync</span></div>}
              {customers && (
                <>
                  <KpiCards kpis={customers.kpis} />
                  <div className="grid2">
                    <ChartCard
                      title="Revenue per customer distribution" sub="Whales vs long tail" type="bar"
                      labels={bdLabels(customers.revenueDistribution, 12)} values={bdValues(customers.revenueDistribution, 12)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                    <ChartCard
                      title="Active customers trend" sub="Unique customers per month" type="line"
                      labels={spLabels(customers.customerTrend)} values={spValues(customers.customerTrend)}
                      datasetLabel="Active customers" valueFormat="integer"
                    />
                  </div>
                  <div className="card">
                    <div className="title">Top customers</div>
                    <div className="tablewrap">
                      <table className="aw-table">
                        <thead>
                          <tr><th>Customer</th><th className="right">Orders</th><th className="right">Revenue</th><th>Last order</th></tr>
                        </thead>
                        <tbody>
                          {customers.topCustomers?.map((r: any, i: number) => (
                            <tr key={i}>
                              <td>{r.customerName}</td><td className="right">{r.orders}</td>
                              <td className="right">{fmtMoney(r.revenue)}</td><td>{fmtDate(r.lastOrderDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SALES TEAM */}
          {activeTab === 3 && (
            <div>
              {loadingSalesTeam && <div className="busy"><span className="material-icons rotating">sync</span></div>}
              {salesTeam && (
                <>
                  <KpiCards kpis={salesTeam.kpis} />
                  <div className="grid2">
                    <ChartCard
                      title="Leaderboard" sub="Top salespeople by revenue" type="bar"
                      labels={bdLabels(salesTeam.leaderboard, 12)} values={bdValues(salesTeam.leaderboard, 12)}
                      datasetLabel="Revenue" valueFormat="money"
                    />
                    <div className="card">
                      <div className="title">Quota vs actual (Top 10)</div>
                      <div className="tablewrap">
                        <table className="aw-table">
                          <thead>
                            <tr><th>Salesperson</th><th className="right">Revenue</th><th className="right">Quota</th><th className="right">Attainment</th></tr>
                          </thead>
                          <tbody>
                            {salesTeam.quota?.map((r: any, i: number) => (
                              <tr key={i}>
                                <td>{r.salesPersonName || `SP ${r.salesPersonId}`}</td>
                                <td className="right">{fmtMoney(r.revenue)}</td>
                                <td className="right">{r.quota ? fmtMoney(r.quota) : '—'}</td>
                                <td className="right">{r.quota ? `${(100 * r.revenue / r.quota).toFixed(0)}%` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SHIPPING */}
          {activeTab === 4 && (
            <div>
              {loadingShipping && <div className="busy"><span className="material-icons rotating">sync</span></div>}
              {shipping && (
                <>
                  <KpiCards kpis={shipping.kpis} />
                  <div className="grid2">
                    <ChartCard
                      title="Lead time by ship method" sub="Average days" type="bar"
                      labels={bdLabels(shipping.leadTimeByShipMethod, 10)} values={bdValues(shipping.leadTimeByShipMethod, 10)}
                      datasetLabel="Days" valueFormat="compact"
                    />
                    <ChartCard
                      title="Freight by ship method" sub="Cost concentration" type="doughnut"
                      labels={bdLabels(shipping.freightByShipMethod, 8)} values={bdValues(shipping.freightByShipMethod, 8)}
                      datasetLabel="Freight" valueFormat="money" showLegend compact
                    />
                  </div>
                  <div className="grid1">
                    <ChartCard
                      title="Lead time by territory" sub="Where delivery speed breaks" type="bar"
                      labels={bdLabels(shipping.leadTimeByTerritory, 12)} values={bdValues(shipping.leadTimeByTerritory, 12)}
                      datasetLabel="Days" valueFormat="compact"
                    />
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
