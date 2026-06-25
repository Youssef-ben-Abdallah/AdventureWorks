import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { environment } from '../../core/api.config';

@Component({
  selector: 'app-cube-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './cube-insights.component.html',
  styleUrls: ['./cube-insights.component.css']
})
export class CubeInsightsComponent implements OnInit {
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

  // Profit Chart (Combo)
  public profitChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };
  public profitChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Gross vs Net Profit by Category' }
    }
  };

  // Freight Chart (Horizontal Bar)
  public freightChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };
  public freightChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Freight Cost Per Item by Region' }
    }
  };

  // Target Status Table
  targetStatus: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadData();
  }

  loadFilters(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/api/CubeInsights/filters`).subscribe({
      next: (res) => {
        this.years = res.years || [];
        this.territories = res.territories || [];
        // Optional: auto-select latest year if empty and years exist
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
      next: (res) => this.kpis = res,
      error: (err) => console.error(err)
    });

    // Load Profit Analysis
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/profit-analysis`, { params }).subscribe({
      next: (res) => {
        if (!res) return;
        this.profitChartData = {
          labels: res.map(r => r.category),
          datasets: [
            { data: res.map(r => r.grossProfit), label: 'Gross Profit', backgroundColor: '#6366f1' },
            { data: res.map(r => r.netProfit), label: 'Net Profit', backgroundColor: '#06b6d4', type: 'line' as any }
          ]
        };
      }
    });

    // Load Freight Analysis
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/freight-analysis`, { params }).subscribe({
      next: (res) => {
        if (!res) return;
        this.freightChartData = {
          labels: res.map(r => r.region),
          datasets: [
            { data: res.map(r => r.freightCost), backgroundColor: '#f43f5e' }
          ]
        };
      }
    });

    // Load Target Status
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/CubeInsights/target-status`, { params }).subscribe({
      next: (res) => {
        this.targetStatus = res || [];
      }
    });
  }
}
