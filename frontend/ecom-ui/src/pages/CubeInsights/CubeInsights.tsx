import React, { useState, useEffect, useMemo } from 'react';
import { CubeInsightsService } from '../../services/cubeInsights';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './CubeInsights.css';

// Chart.js was used in Angular, but we will use Recharts via ChartCard and Recharts components
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

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
  const [freightData, setFreightData] = useState<any[]>([]);
  const [targetData, setTargetData] = useState<any[]>([]);

  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [drillMonth, setDrillMonth] = useState<string | null>(null);
  const [drillTerritoryGroup, setDrillTerritoryGroup] = useState<string | null>(null);
  const [drillTerritoryCountry, setDrillTerritoryCountry] = useState<string | null>(null);
  const [drillSubcategory, setDrillSubcategory] = useState<string | null>(null);

  // Product Insights data
  const [productCostData, setProductCostData] = useState<any[]>([]);
  const [discountByProductData, setDiscountByProductData] = useState<any[]>([]);
  const [orderVolumeData, setOrderVolumeData] = useState<any[]>([]);
  const [priceGapData, setPriceGapData] = useState<any[]>([]);
  // Product drill states
  const [drillCostCategory, setDrillCostCategory] = useState<string | null>(null);
  const [drillCostSubcategory, setDrillCostSubcategory] = useState<string | null>(null);
  const [drillDiscountCategory, setDrillDiscountCategory] = useState<string | null>(null);

  // Territory detail data
  const [territoryDetail, setTerritoryDetail] = useState<any[]>([]);

  // Employee data
  const [employeeKpis, setEmployeeKpis] = useState<any>({ activeEmployees: 0, avgRevenuePerEmployee: 0, topEmployeeRevenue: 0, totalRevenue: 0 });
  const [topEmployees, setTopEmployees] = useState<any[]>([]);
  const [empByTerritory, setEmpByTerritory] = useState<any[]>([]);
  const [employeeAov, setEmployeeAov] = useState<any[]>([]);
  const [drillEmpTerritory, setDrillEmpTerritory] = useState<string | null>(null);

  // Promotions data
  const [promotionKpis, setPromotionKpis] = useState<any>({ totalDiscount: 0, discountRevenueRatio: 0, avgDiscountPerOrder: 0, totalOrders: 0 });
  const [salesByPromotion, setSalesByPromotion] = useState<any[]>([]);
  const [discountTrend, setDiscountTrend] = useState<any[]>([]);
  const [salesByCurrency, setSalesByCurrency] = useState<any[]>([]);
  const [drillDiscountMonth, setDrillDiscountMonth] = useState<string | null>(null);

  // Fulfillment data
  const [fulfillmentKpis, setFulfillmentKpis] = useState<any>({ totalFreight: 0, freightRevenueRatio: 0, freightPerUnit: 0, totalOrders: 0 });
  const [shippingVolume, setShippingVolume] = useState<any[]>([]);
  const [freightByTerritory, setFreightByTerritory] = useState<any[]>([]);
  const [orderShipLag, setOrderShipLag] = useState<any[]>([]);
  const [drillShipMonth, setDrillShipMonth] = useState<string | null>(null);
  const [drillFreightGroup, setDrillFreightGroup] = useState<string | null>(null);
  const [drillFreightCountry, setDrillFreightCountry] = useState<string | null>(null);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedTerritory, activeTab, drillCategory, drillMonth, drillTerritoryGroup, drillTerritoryCountry, drillSubcategory, drillCostCategory, drillCostSubcategory, drillDiscountCategory, drillEmpTerritory, drillDiscountMonth, drillShipMonth, drillFreightGroup, drillFreightCountry]);

  const loadFilters = async () => {
    try {
      const res = await CubeInsightsService.getFilters();
      setYears(res.years || []);
      setTerritories(res.territories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    const params: any = {};
    if (selectedYear !== 'All') params.year = selectedYear;
    if (selectedTerritory !== 'All') params.territory = selectedTerritory;

    const profitParams = { ...params };
    if (drillCategory) profitParams.category = drillCategory;

    const trendParams = { ...params };
    if (drillMonth) trendParams.month = drillMonth;

    const territoryParams = { ...params };
    if (drillTerritoryCountry) {
      territoryParams.territoryGroup = drillTerritoryGroup;
      territoryParams.territoryCountry = drillTerritoryCountry;
    } else if (drillTerritoryGroup) {
      territoryParams.territoryGroup = drillTerritoryGroup;
    }

    const productParams = { ...params };
    if (drillSubcategory) productParams.subcategory = drillSubcategory;

    const results = await Promise.allSettled([
      CubeInsightsService.getKpis(params),
      CubeInsightsService.getProfitAnalysis(profitParams),
      CubeInsightsService.getSalesTrend(trendParams),
      CubeInsightsService.getTopProducts(productParams),
      CubeInsightsService.getTerritorySales(territoryParams),
      CubeInsightsService.getFreightAnalysis(params),
      CubeInsightsService.getTargetStatus(params)
    ]);
    const val = (i: number, fallback: any = []) =>
      results[i].status === 'fulfilled' ? results[i].value : fallback;
    setKpis(val(0, { grossProfitMargin: 0, aov: 0, discountRatio: 0, effectiveTaxRate: 0 }));
    setProfitData(val(1) || []);
    setTrendData(val(2) || []);
    setTopProducts(val(3) || []);
    setTerritorySales(val(4) || []);
    setFreightData(val(5) || []);
    setTargetData(val(6) || []);

    // Tab 1: Product Insights
    if (activeTab === 1) {
      const costParams = { ...params };
      if (drillCostSubcategory) { costParams.category = drillCostCategory; costParams.subcategory = drillCostSubcategory; }
      else if (drillCostCategory) costParams.category = drillCostCategory;
      const discProdParams = { ...params };
      if (drillDiscountCategory) discProdParams.category = drillDiscountCategory;

      const prodResults = await Promise.allSettled([
        CubeInsightsService.getProductCostAnalysis(costParams),
        CubeInsightsService.getDiscountByProduct(discProdParams),
        CubeInsightsService.getOrderVolumeByProduct(params),
        CubeInsightsService.getPriceGapAnalysis(params),
      ]);
      const pval = (i: number, fb: any = []) => prodResults[i].status === 'fulfilled' ? prodResults[i].value : fb;
      setProductCostData(pval(0) || []);
      setDiscountByProductData(pval(1) || []);
      setOrderVolumeData(pval(2) || []);
      setPriceGapData(pval(3) || []);
    }

    // Tab 2: Territory Map detail
    if (activeTab === 2) {
      const detailParams: any = {};
      if (selectedYear !== 'All') detailParams.year = selectedYear;
      if (drillTerritoryCountry) { detailParams.territoryGroup = drillTerritoryGroup; detailParams.territoryCountry = drillTerritoryCountry; }
      else if (drillTerritoryGroup) detailParams.territoryGroup = drillTerritoryGroup;
      const detailRes = await Promise.allSettled([CubeInsightsService.getTerritoryDetail(detailParams)]);
      setTerritoryDetail(detailRes[0].status === 'fulfilled' ? detailRes[0].value : []);
    }

    // Tab 3: Employee Performance
    if (activeTab === 3) {
      const empTerrParams: any = {};
      if (selectedYear !== 'All') empTerrParams.year = selectedYear;
      if (drillEmpTerritory) empTerrParams.territoryGroup = drillEmpTerritory;
      const empResults = await Promise.allSettled([
        CubeInsightsService.getEmployeeKpis(params),
        CubeInsightsService.getTopEmployees(params),
        CubeInsightsService.getEmployeeSalesByTerritory(empTerrParams),
        CubeInsightsService.getEmployeeAov(params),
      ]);
      const eval_ = (i: number, fb: any = []) => empResults[i].status === 'fulfilled' ? empResults[i].value : fb;
      setEmployeeKpis(eval_(0, { activeEmployees: 0, avgRevenuePerEmployee: 0, topEmployeeRevenue: 0, totalRevenue: 0 }));
      setTopEmployees(eval_(1) || []);
      setEmpByTerritory(eval_(2) || []);
      setEmployeeAov(eval_(3) || []);
    }

    // Tab 4: Promotions & Discounts
    if (activeTab === 4) {
      const discTrendParams = { ...params };
      if (drillDiscountMonth) discTrendParams.month = drillDiscountMonth;
      const promoResults = await Promise.allSettled([
        CubeInsightsService.getPromotionKpis(params),
        CubeInsightsService.getSalesByPromotion(params),
        CubeInsightsService.getDiscountTrend(discTrendParams),
        CubeInsightsService.getSalesByCurrency(params),
      ]);
      const prval = (i: number, fb: any = []) => promoResults[i].status === 'fulfilled' ? promoResults[i].value : fb;
      setPromotionKpis(prval(0, { totalDiscount: 0, discountRevenueRatio: 0, avgDiscountPerOrder: 0, totalOrders: 0 }));
      setSalesByPromotion(prval(1) || []);
      setDiscountTrend(prval(2) || []);
      setSalesByCurrency(prval(3) || []);
    }

    // Tab 5: Order Fulfillment
    if (activeTab === 5) {
      const shipParams = { ...params };
      if (drillShipMonth) shipParams.month = drillShipMonth;
      const freightTerrParams: any = {};
      if (selectedYear !== 'All') freightTerrParams.year = selectedYear;
      if (drillFreightCountry) { freightTerrParams.territoryGroup = drillFreightGroup; freightTerrParams.territoryCountry = drillFreightCountry; }
      else if (drillFreightGroup) freightTerrParams.territoryGroup = drillFreightGroup;
      const fulfResults = await Promise.allSettled([
        CubeInsightsService.getFulfillmentKpis(params),
        CubeInsightsService.getShippingVolume(shipParams),
        CubeInsightsService.getFreightByTerritory(freightTerrParams),
        CubeInsightsService.getOrderShipLag(params),
      ]);
      const fval = (i: number, fb: any = []) => fulfResults[i].status === 'fulfilled' ? fulfResults[i].value : fb;
      setFulfillmentKpis(fval(0, { totalFreight: 0, freightRevenueRatio: 0, freightPerUnit: 0, totalOrders: 0 }));
      setShippingVolume(fval(1) || []);
      setFreightByTerritory(fval(2) || []);
      setOrderShipLag(fval(3) || []);
    }
  };

  const handleTrendClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillMonth) {
        setDrillMonth(data.activeLabel);
      }
    }
  };

  const handleCategoryClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillCategory) {
        setDrillCategory(data.activeLabel);
      }
    }
  };

  const handleProductClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillSubcategory) {
        setDrillSubcategory(data.activeLabel);
      }
    }
  };

  const handleMapClick = (regionName: string) => {
    if (!regionName) return;
    if (!drillTerritoryGroup) {
      setDrillTerritoryGroup(regionName);
    } else if (!drillTerritoryCountry) {
      setDrillTerritoryCountry(regionName);
    }
  };

  const handleCostCategoryClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillCostCategory) {
        setDrillCostCategory(data.activeLabel);
      } else if (!drillCostSubcategory) {
        setDrillCostSubcategory(data.activeLabel);
      }
    }
  };

  const handleDiscountCategoryClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillDiscountCategory) {
        setDrillDiscountCategory(data.activeLabel);
      }
    }
  };

  const handleEmpTerritoryClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillEmpTerritory) {
        setDrillEmpTerritory(data.activeLabel);
      }
    }
  };

  const handleDiscountTrendClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillDiscountMonth) {
        setDrillDiscountMonth(data.activeLabel);
      }
    }
  };

  const handleShipVolumeClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillShipMonth) {
        setDrillShipMonth(data.activeLabel);
      }
    }
  };

  const handleFreightTerritoryClick = (data: any) => {
    if (data && data.activeLabel) {
      if (!drillFreightGroup) {
        setDrillFreightGroup(data.activeLabel);
      } else if (!drillFreightCountry) {
        setDrillFreightCountry(data.activeLabel);
      }
    }
  };

  const formatPercent = (v: number) => {
    return new Intl.NumberFormat(undefined, { style: 'percent', minimumFractionDigits: 2 }).format(v || 0);
  };
  const formatMoney = (v: number) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v || 0);
  };
  const formatMoneyCompact = (v: number) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v || 0);
  };

  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-label">{label || payload[0].payload.name || payload[0].payload.month || payload[0].payload.category || payload[0].payload.product}</div>
          {payload.map((p: any, i: number) => (
            <div key={i} className="tooltip-value">
              <span className="tooltip-dataset">{p.name}: </span>
              {formatMoney(p.value)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const mapCoords: Record<string, [number, number]> = {
    // Groups
    'North America': [40, -100],
    'Europe': [50, 10],
    'Pacific': [-10, 150],
    // Countries
    'Australia': [-25, 135],
    'United States': [38, -97],
    'Canada': [56, -106],
    'France': [46, 2],
    'Germany': [51, 9],
    'United Kingdom': [53, -2],
    // US Regions
    'Southwest': [33, -112],
    'Northwest': [45, -120],
    'Central': [39, -98],
    'Southeast': [33, -83],
    'Northeast': [42, -73],
    // AU Regions
    'New South Wales': [-33, 151],
    'Victoria': [-37, 145],
    'Queensland': [-23, 150],
    // CA Regions
    'Alberta': [53, -115],
    'British Columbia': [53, -127],
    'Ontario': [50, -85],
    // UK Regions
    'England': [52, -1],
    'Scotland': [57, -4],
    // FR Regions
    'Seine (Paris)': [48.8, 2.3],
    'Charente-Maritime': [46, -1],
    'Garonne (Haute)': [43.6, 1.4],
    'Yvelines': [48.8, 1.9],
    'Essonne': [48.5, 2.3],
    'Hauts de Seine': [48.8, 2.2],
    'Nord': [50.6, 3.1],
    'Somme': [49.9, 2.3],
    'Pas de Calais': [50.5, 2.3],
    'Loir et Cher': [47.6, 1.3],
    'Loire': [45.7, 4.1],
    // DE Regions
    'Hamburg': [53.5, 10],
    'Bayern': [48.8, 11.5],
    'Brandenburg': [52.4, 13.1],
    'Hessen': [50.6, 9],
    'Nordrhein-Westfalen': [51.5, 7.5],
    'Saarland': [49.4, 7],
  };

  const maxSales = useMemo(() => {
    return Math.max(...territorySales.map(t => t.sales || 0), 1);
  }, [territorySales]);

  const targetPieData = useMemo(() => {
    let met = 0;
    let notMet = 0;
    targetData.forEach((d: any) => {
      if (d.sales >= d.target) met++;
      else notMet++;
    });
    return [
      { name: 'Target Met', value: met, fill: '#10b981' },
      { name: 'Target Not Met', value: notMet, fill: '#f43f5e' }
    ];
  }, [targetData]);

  const territoryDetailTotals = useMemo(() => {
    let totalSales = 0;
    let totalOrders = 0;
    let totalFreight = 0;
    territoryDetail.forEach((t: any) => {
      totalSales += t.sales || 0;
      totalOrders += t.orderQty || 0;
      totalFreight += t.freight || 0;
    });
    const avgFreightPerUnit = totalOrders > 0 ? totalFreight / totalOrders : 0;
    return { totalSales, totalOrders, totalFreight, avgFreightPerUnit };
  }, [territoryDetail]);

  return (
    <div className="ci-shell">
      {/* HEADER */}
      <div className="aw-page-header with-inner">
        <div className="aw-page-header-inner">
          <div className="ci-header-left">
            <div className="h">
              Cube Insights
            </div>
            <div className="sub"><strong>Deep multi-dimensional analysis on reseller performance</strong></div>
          </div>
        </div>
      </div>

      <div className="aw-page-content">
        <div className="filters card">
          <div className="filters-grid">
            <div className="filter-item">
              <label>Calendar Year</label>
              <select value={selectedYear} onChange={e => {
                setSelectedYear(e.target.value);
                setDrillCategory(null);
                setDrillMonth(null);
                setDrillSubcategory(null);
                setDrillTerritoryGroup(null);
                setDrillTerritoryCountry(null);
                setDrillCostCategory(null);
                setDrillCostSubcategory(null);
                setDrillDiscountCategory(null);
                setDrillEmpTerritory(null);
                setDrillDiscountMonth(null);
                setDrillShipMonth(null);
                setDrillFreightGroup(null);
                setDrillFreightCountry(null);
              }}>
                <option value="All">All</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>Sales Territory</label>
              <select value={selectedTerritory} onChange={e => {
                setSelectedTerritory(e.target.value);
                setDrillCategory(null);
                setDrillMonth(null);
                setDrillSubcategory(null);
                setDrillTerritoryGroup(null);
                setDrillTerritoryCountry(null);
                setDrillCostCategory(null);
                setDrillCostSubcategory(null);
                setDrillDiscountCategory(null);
                setDrillEmpTerritory(null);
                setDrillDiscountMonth(null);
                setDrillShipMonth(null);
                setDrillFreightGroup(null);
                setDrillFreightCountry(null);
              }}>
                <option value="All">All</option>
                {territories.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="tabs-container ci-tabs">
          <div className="tabs-header">
            {['Overview', 'Product Insights', 'Territory Map', 'Employee Performance', 'Promotions & Discounts', 'Order Fulfillment'].map((name, i) => {
              const icons = ['dashboard', 'inventory_2', 'public', 'badge', 'local_offer', 'local_shipping'];
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
                  <h3 className="chart-title">
                    {drillMonth ? `Daily Sales & Profit (${drillMonth})` : 'Monthly Sales & Profit Trend'}
                  </h3>
                  {drillMonth && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillMonth(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleTrendClick} style={{ cursor: drillMonth ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
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
                  <h3 className="chart-title">
                    {drillCategory ? `Profitability (${drillCategory})` : 'Profitability by Category'}
                  </h3>
                  {drillCategory && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillCategory(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profitData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleCategoryClick} style={{ cursor: drillCategory ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="grossProfit" name="Gross Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Freight Analysis */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Freight Cost per Item by Region</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={freightData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="region" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="freightCost" name="Freight per Item" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Sales Target Status ($5M)</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={targetData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="group" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Actual Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Line type="step" dataKey="target" name="Target ($5M)" stroke="#ef4444" strokeWidth={3} dot={false} />
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
                <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="chart-title" style={{ margin: 0 }}>
                    {drillSubcategory ? `Top 10 Products (${drillSubcategory})` : 'Top 10 Subcategories by Revenue'}
                  </h3>
                  {drillSubcategory && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillSubcategory(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart layout="vertical" data={topProducts} margin={{ top: 10, right: 30, left: 80, bottom: 25 }} onClick={handleProductClick} style={{ cursor: drillSubcategory ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <YAxis type="category" dataKey="product" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Cost vs Revenue */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillCostSubcategory
                      ? `Product Cost vs Revenue (${drillCostSubcategory})`
                      : drillCostCategory
                        ? `Product Cost vs Revenue (${drillCostCategory})`
                        : 'Product Cost vs Revenue'}
                  </h3>
                  {drillCostCategory && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => {
                      if (drillCostSubcategory) {
                        setDrillCostSubcategory(null);
                      } else {
                        setDrillCostCategory(null);
                      }
                    }}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={productCostData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleCostCategoryClick} style={{ cursor: drillCostSubcategory ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="salesAmount" name="Sales Amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="standardCost" name="Standard Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="marginPct" name="Margin %" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Discount Impact by Category */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillDiscountCategory
                      ? `Discount Impact (${drillDiscountCategory})`
                      : 'Discount Impact by Category'}
                  </h3>
                  {drillDiscountCategory && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillDiscountCategory(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={discountByProductData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleDiscountCategoryClick} style={{ cursor: drillDiscountCategory ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="discountAmount" name="Discount Amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="discountPct" name="Discount %" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Volume Distribution */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Order Volume Distribution</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderVolumeData} dataKey="quantity" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                        {orderVolumeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'][index % 6]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* List Price vs Actual Revenue */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">List Price vs Actual Revenue</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={priceGapData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="extendedAmount" name="Extended Amount" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="salesAmount" name="Sales Amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* TERRITORY MAP */}
          <div style={{ display: activeTab === 2 ? 'block' : 'none' }}>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <div className="kpi-icon icon-purple"><span className="material-icons">attach_money</span></div>
                <div className="kpi-info">
                  <h3>Total Sales</h3>
                  <p className="kpi-value">{formatMoney(territoryDetailTotals.totalSales)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue"><span className="material-icons">shopping_cart</span></div>
                <div className="kpi-info">
                  <h3>Total Orders</h3>
                  <p className="kpi-value">{new Intl.NumberFormat().format(territoryDetailTotals.totalOrders)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-cyan"><span className="material-icons">local_shipping</span></div>
                <div className="kpi-info">
                  <h3>Avg Freight/Unit</h3>
                  <p className="kpi-value">{formatMoney(territoryDetailTotals.avgFreightPerUnit)}</p>
                </div>
              </div>
            </section>

            <div style={{ position: 'relative', height: '600px', width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
              <div className="chart-card map-card glass" style={{ height: '100%', padding: 0 }}>
                <div className="chart-header map-header" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="chart-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                    {drillTerritoryCountry
                      ? `Regions in ${drillTerritoryCountry}`
                      : drillTerritoryGroup
                        ? `Countries in ${drillTerritoryGroup}`
                        : 'Global Territory Sales Map'}
                  </h2>
                  {drillTerritoryGroup && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => {
                      if (drillTerritoryCountry) {
                        setDrillTerritoryCountry(null);
                      } else {
                        setDrillTerritoryGroup(null);
                      }
                    }}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div style={{ flex: 1, height: 'calc(100% - 70px)' }}>
                  {activeTab === 2 && (() => {
                    const drillKey = drillTerritoryCountry || drillTerritoryGroup || 'world';
                    const mapCenter = drillTerritoryCountry && mapCoords[drillTerritoryCountry]
                      ? mapCoords[drillTerritoryCountry]
                      : drillTerritoryGroup && mapCoords[drillTerritoryGroup]
                        ? mapCoords[drillTerritoryGroup]
                        : [30, 0];
                    const mapZoom = drillTerritoryCountry ? 5 : drillTerritoryGroup ? 4 : 2;
                    const canDrillDeeper = !drillTerritoryCountry;

                    return (
                      <MapContainer key={drillKey} center={mapCenter as any} zoom={mapZoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                        <TileLayer
                          attribution='&copy; OpenStreetMap'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {territorySales.filter(t => t.region && mapCoords[t.region]).map((t, idx) => {
                          const coord = mapCoords[t.region];
                          const radius = Math.max(8, (t.sales / maxSales) * 30);
                          const detailMatch = territoryDetail.find((d: any) => d.region === t.region);
                          const markerColor = detailMatch
                            ? (detailMatch.marginPct >= 0 ? '#10b981' : '#f43f5e')
                            : '#f43f5e';
                          return (
                            <CircleMarker
                              key={idx}
                              center={coord}
                              radius={radius}
                              color={markerColor}
                              fillColor={markerColor}
                              fillOpacity={0.6}
                              weight={2}
                              pathOptions={{ className: canDrillDeeper ? 'clickable-marker' : '' }}
                              eventHandlers={{ click: () => handleMapClick(t.region) }}
                            >
                              <LeafletTooltip>
                              <b>{t.region}</b><br/>
                              Sales: {formatMoney(t.sales)}
                            </LeafletTooltip>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="chart-card glass" style={{ marginTop: '1.5rem', overflow: 'auto' }}>
              <table className="territory-table">
                <thead>
                  <tr>
                    <th>Territory</th>
                    <th>Sales</th>
                    <th>Net Profit</th>
                    <th>Orders</th>
                    <th>Freight</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {territoryDetail.map((t, i) => (
                    <tr key={i}>
                      <td>{t.region}</td>
                      <td>{formatMoney(t.sales)}</td>
                      <td style={{ color: t.profit >= 0 ? '#10b981' : '#f43f5e' }}>{formatMoney(t.profit)}</td>
                      <td>{t.orderQty}</td>
                      <td>{formatMoney(t.freight)}</td>
                      <td>{formatPercent(t.marginPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* EMPLOYEE PERFORMANCE */}
          <div style={{ display: activeTab === 3 ? 'block' : 'none' }}>
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-purple"><span className="material-icons">groups</span></div>
                <div className="kpi-info">
                  <h3>Active Employees</h3>
                  <p className="kpi-value">{new Intl.NumberFormat().format(employeeKpis.activeEmployees)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue"><span className="material-icons">trending_up</span></div>
                <div className="kpi-info">
                  <h3>Avg Revenue/Employee</h3>
                  <p className="kpi-value">{formatMoneyCompact(employeeKpis.avgRevenuePerEmployee)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-pink"><span className="material-icons">star</span></div>
                <div className="kpi-info">
                  <h3>Top Employee Revenue</h3>
                  <p className="kpi-value">{formatMoneyCompact(employeeKpis.topEmployeeRevenue)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-cyan"><span className="material-icons">account_balance_wallet</span></div>
                <div className="kpi-info">
                  <h3>Total Revenue</h3>
                  <p className="kpi-value">{formatMoneyCompact(employeeKpis.totalRevenue)}</p>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              {/* Top 10 Employees */}
              <div className="chart-card glass" style={{ height: '600px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Top 10 Employees</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart layout="vertical" data={topEmployees} margin={{ top: 10, right: 30, left: 80, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <YAxis type="category" dataKey="employee" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employee Sales by Territory */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillEmpTerritory
                      ? `Employee Sales (${drillEmpTerritory})`
                      : 'Employee Sales by Territory'}
                  </h3>
                  {drillEmpTerritory && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillEmpTerritory(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={empByTerritory} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleEmpTerritoryClick} style={{ cursor: drillEmpTerritory ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="territory" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="employeeCount" name="Employee Count" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Employee AOV */}
              <div className="chart-card glass" style={{ height: '600px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Employee Average Order Value</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart layout="vertical" data={employeeAov} margin={{ top: 10, right: 30, left: 80, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <YAxis type="category" dataKey="employee" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="aov" name="Avg Order Value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="orderCount" name="Order Count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* PROMOTIONS & DISCOUNTS */}
          <div style={{ display: activeTab === 4 ? 'block' : 'none' }}>
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-purple"><span className="material-icons">money_off</span></div>
                <div className="kpi-info">
                  <h3>Total Discount</h3>
                  <p className="kpi-value">{formatMoneyCompact(promotionKpis.totalDiscount)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue"><span className="material-icons">percent</span></div>
                <div className="kpi-info">
                  <h3>Discount/Revenue Ratio</h3>
                  <p className="kpi-value">{formatPercent(promotionKpis.discountRevenueRatio)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-pink"><span className="material-icons">receipt_long</span></div>
                <div className="kpi-info">
                  <h3>Avg Discount/Order</h3>
                  <p className="kpi-value">{formatMoney(promotionKpis.avgDiscountPerOrder)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-cyan"><span className="material-icons">shopping_bag</span></div>
                <div className="kpi-info">
                  <h3>Total Orders</h3>
                  <p className="kpi-value">{new Intl.NumberFormat().format(promotionKpis.totalOrders)}</p>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              {/* Revenue by Promotion */}
              <div className="chart-card glass" style={{ height: '600px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Revenue by Promotion</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart layout="vertical" data={salesByPromotion} margin={{ top: 10, right: 30, left: 80, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <YAxis type="category" dataKey="promotion" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="discount" name="Discount" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Discount Trend */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillDiscountMonth
                      ? `Daily Discount Trend (${drillDiscountMonth})`
                      : 'Monthly Discount Trend'}
                  </h3>
                  {drillDiscountMonth && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillDiscountMonth(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={discountTrend} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleDiscountTrendClick} style={{ cursor: drillDiscountMonth ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="discountAmount" name="Discount Amount" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="discountRatio" name="Discount Ratio" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Currency */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Revenue by Currency</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByCurrency} dataKey="sales" nameKey="currency" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                        {salesByCurrency.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* ORDER FULFILLMENT */}
          <div style={{ display: activeTab === 5 ? 'block' : 'none' }}>
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon icon-purple"><span className="material-icons">local_shipping</span></div>
                <div className="kpi-info">
                  <h3>Total Freight</h3>
                  <p className="kpi-value">{formatMoneyCompact(fulfillmentKpis.totalFreight)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-blue"><span className="material-icons">percent</span></div>
                <div className="kpi-info">
                  <h3>Freight/Revenue Ratio</h3>
                  <p className="kpi-value">{formatPercent(fulfillmentKpis.freightRevenueRatio)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-pink"><span className="material-icons">inventory</span></div>
                <div className="kpi-info">
                  <h3>Freight per Unit</h3>
                  <p className="kpi-value">{formatMoney(fulfillmentKpis.freightPerUnit)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon icon-cyan"><span className="material-icons">shopping_bag</span></div>
                <div className="kpi-info">
                  <h3>Total Orders</h3>
                  <p className="kpi-value">{new Intl.NumberFormat().format(fulfillmentKpis.totalOrders)}</p>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              {/* Monthly Shipping Volume */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillShipMonth
                      ? `Daily Shipping Volume (${drillShipMonth})`
                      : 'Monthly Shipping Volume'}
                  </h3>
                  {drillShipMonth && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => setDrillShipMonth(null)}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={shippingVolume} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleShipVolumeClick} style={{ cursor: drillShipMonth ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="quantity" name="Quantity" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="freight" name="Freight" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Freight by Territory */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">
                    {drillFreightCountry
                      ? `Freight (${drillFreightCountry})`
                      : drillFreightGroup
                        ? `Freight (${drillFreightGroup})`
                        : 'Freight by Territory'}
                  </h3>
                  {drillFreightGroup && (
                    <button className="btn-secondary-glass" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => {
                      if (drillFreightCountry) {
                        setDrillFreightCountry(null);
                      } else {
                        setDrillFreightGroup(null);
                      }
                    }}>
                      <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>arrow_upward</span>
                      Roll up
                    </button>
                  )}
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={freightByTerritory} margin={{ top: 10, right: 30, left: 20, bottom: 25 }} onClick={handleFreightTerritoryClick} style={{ cursor: drillFreightCountry ? 'default' : 'pointer' }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="region" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="freight" name="Freight" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="freightPerUnit" name="Freight/Unit" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order vs Ship Lag */}
              <div className="chart-card glass" style={{ height: '400px' }}>
                <div className="chart-header">
                  <h3 className="chart-title">Order vs Ship Lag</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={orderShipLag} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="quarter" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                      <RechartsTooltip content={renderTooltip} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="ordersPlaced" name="Orders Placed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ordersShipped" name="Orders Shipped" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
