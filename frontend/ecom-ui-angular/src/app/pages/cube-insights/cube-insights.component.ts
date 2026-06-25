import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import * as L from 'leaflet';
import { environment } from '../../core/api.config';

@Component({
  selector: 'app-cube-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, MatTabsModule],
  templateUrl: './cube-insights.component.html',
  styleUrls: ['./cube-insights.component.css']
})
export class CubeInsightsComponent implements OnInit, AfterViewInit {
  activeTab: string = 'overview'; // 'overview', 'products', 'map'

  // Filters
  selectedYear: string = '2013';
  selectedTerritory: string = 'All';

  years: string[] = [];
  territories: string[] = [];

  // KPIs
  kpis = {
    grossProfitMargin: 0,
    aov: 0,
    discountRatio: 0,
    effectiveTaxRate: 0
  };

  // Profit Chart
  public profitChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public profitChartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Profitability by Category' } }
  };

  // Trend Chart
  public trendChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public trendChartOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Monthly Sales & Profit Trend' } }
  };

  // Top Products Chart
  public topProductsChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public topProductsChartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Top 10 Products by Revenue' } }
  };

  // Map Data
  private map: L.Map | undefined;
  territorySales: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadData();
  }

  ngAfterViewInit(): void {
    // map initialization is handled via [hidden] and timeouts if needed
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'map') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  tabChanged(index: number) {
    const tabs = ['overview', 'products', 'map'];
    this.activeTab = tabs[index] ?? 'overview';
    if (this.activeTab === 'map') {
      setTimeout(() => this.initMap(), 150);
    }
  }

  loadFilters(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/api/CubeInsights/filters`).subscribe({
      next: (res) => {
        this.years = res.years || [];
        this.territories = res.territories || [];
        if (!this.selectedYear && this.years.length > 0) {
          this.selectedYear = this.years[this.years.length - 1];
        }
      },
      error: (err) => console.error('Error loading filters', err)
    });
  }

  onFilterChange(): void {
    this.loadData();
  }

  loadData(): void {
    const params: any = {};
    if (this.selectedYear !== 'All') params.year = this.selectedYear;
    if (this.selectedTerritory !== 'All') params.territory = this.selectedTerritory;

    // Load KPIs
    this.http.get<any>(`${environment.apiBaseUrl}/api/CubeInsights/kpis`, { params }).subscribe({
      next: res => this.kpis = res, error: err => console.error(err)
    });

    // Load Profit Analysis
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/profit-analysis`, { params }).subscribe({
      next: res => {
        if (res) {
          this.profitChartData = {
            labels: res.map(r => r.category || 'Unknown'),
            datasets: [
              { data: res.map(r => r.grossProfit), label: 'Gross Profit', backgroundColor: '#6366f1' },
              { data: res.map(r => r.netProfit), label: 'Net Profit', backgroundColor: '#06b6d4', type: 'line' as any }
            ]
          };
        }
      }
    });

    // Load Sales Trend
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/sales-trend`, { params }).subscribe({
      next: res => {
        if (res) {
          this.trendChartData = {
            labels: res.map(r => r.month),
            datasets: [
              { data: res.map(r => r.sales), label: 'Sales Amount', borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.2)', fill: true, tension: 0.4 },
              { data: res.map(r => r.profit), label: 'Net Profit', borderColor: '#10b981', tension: 0.4 }
            ]
          };
        }
      }
    });

    // Load Top Products
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/top-products`, { params }).subscribe({
      next: res => {
        if (res) {
          this.topProductsChartData = {
            labels: res.map(r => r.product),
            datasets: [
              { data: res.map(r => r.sales), label: 'Sales', backgroundColor: '#8b5cf6' },
              { data: res.map(r => r.profit), label: 'Profit', backgroundColor: '#14b8a6' }
            ]
          };
        }
      }
    });

    // Load Territory Sales for Map
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/territory-sales`, { params }).subscribe({
      next: res => {
        if (res) {
          this.territorySales = res;
          if (this.activeTab === 'map') {
            this.updateMapMarkers();
          }
        }
      }
    });
  }

  initMap() {
    if (this.map) {
      this.map.invalidateSize();
      this.updateMapMarkers();
      return;
    }
    const mapElement = document.getElementById('territoryMap');
    if (!mapElement) return;

    this.map = L.map(mapElement).setView([30, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map) return;
    
    this.map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        layer.remove();
      }
    });

    const coords: Record<string, [number, number]> = {
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

    let maxSales = Math.max(...this.territorySales.map(t => t.sales || 0));
    if (maxSales === 0) maxSales = 1;

    this.territorySales.forEach(t => {
      if (!t.region) return;
      const c = coords[t.region];
      if (c) {
        const radius = Math.max(8, (t.sales / maxSales) * 30);
        L.circleMarker(c, {
          radius: radius,
          color: '#f43f5e',
          fillColor: '#f43f5e',
          fillOpacity: 0.6,
          weight: 2
        })
        .bindTooltip(`<b>${t.region}</b><br>Sales: $${Number(t.sales).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`)
        .addTo(this.map!);
      }
    });
  }
}
