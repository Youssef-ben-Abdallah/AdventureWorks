import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CustomersDto,
  DashboardFilters,
  DashboardQuery,
  DashboardService,
  OverviewDto,
  ProductsDto,
  SalesTeamDto,
  ShippingDto,
  DetailRow,
  PagedResult,
  BreakdownItem,
  SeriesPoint
} from 'src/app/core/services/dashboard.service';
import { KpiCardsComponent } from 'src/app/shared/dashboard-widgets/kpi-cards.component';
import { NotesPanelComponent } from 'src/app/shared/dashboard-widgets/notes-panel.component';
import { SimpleBarChartComponent } from 'src/app/shared/dashboard-widgets/simple-bar-chart.component';
import { SimpleLineChartComponent } from 'src/app/shared/dashboard-widgets/simple-line-chart.component';
import { ChartJsCardComponent } from 'src/app/shared/dashboard-widgets/chartjs-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    KpiCardsComponent,
    SimpleLineChartComponent,
    SimpleBarChartComponent,
    ChartJsCardComponent,
    NotesPanelComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  filters: DashboardFilters | null = null;
  loadingFilters = false;
  error = '';

  activeTab = 0;

  // cached responses per tab
  overview: OverviewDto | null = null;
  products: ProductsDto | null = null;
  customers: CustomersDto | null = null;
  salesTeam: SalesTeamDto | null = null;
  shipping: ShippingDto | null = null;
  details: PagedResult<DetailRow> | null = null;

  loadingOverview = false;
  loadingProducts = false;
  loadingCustomers = false;
  loadingSalesTeam = false;
  loadingShipping = false;
  loadingDetails = false;

  detailPage = 1;
  detailPageSize = 50;

  form = new FormGroup({
    from: new FormControl<string | Date | null>(null),
    to: new FormControl<string | Date | null>(null),
    territoryId: new FormControl<string | null>(null),
    territoryGroup: new FormControl<string | null>(null),
    salesPersonId: new FormControl<string | null>(null),
    shipMethodId: new FormControl<string | null>(null),
    category: new FormControl<string | null>(null),
    subCategory: new FormControl<string | null>(null),
    currencyCode: new FormControl<string | null>(null),
    online: new FormControl<string | null>(null)
  });

  detailColumns = ['orderDate', 'salesOrderId', 'customer', 'product', 'category', 'territory', 'salesPerson', 'qty', 'lineTotal'];

  // ---- chart helpers (keep templates clean) ----
  private bdLabelsMemo = new Map<any, string[]>();
  bdLabels(data: BreakdownItem[] | null | undefined, n = 12): string[] {
    if (!data) return [];
    if (this.bdLabelsMemo.has(data)) return this.bdLabelsMemo.get(data)!;
    const res = data.slice(0, n).map(x => x.label);
    this.bdLabelsMemo.set(data, res);
    return res;
  }

  private bdValuesMemo = new Map<any, number[]>();
  bdValues(data: BreakdownItem[] | null | undefined, n = 12): number[] {
    if (!data) return [];
    if (this.bdValuesMemo.has(data)) return this.bdValuesMemo.get(data)!;
    const res = data.slice(0, n).map(x => x.value);
    this.bdValuesMemo.set(data, res);
    return res;
  }

  private spLabelsMemo = new Map<any, string[]>();
  spLabels(data: SeriesPoint[] | null | undefined, n = 60): string[] {
    if (!data) return [];
    if (this.spLabelsMemo.has(data)) return this.spLabelsMemo.get(data)!;
    const res = data.slice(0, n).map(x => x.x);
    this.spLabelsMemo.set(data, res);
    return res;
  }

  private spValuesMemo = new Map<any, number[]>();
  spValues(data: SeriesPoint[] | null | undefined, n = 60): number[] {
    if (!data) return [];
    if (this.spValuesMemo.has(data)) return this.spValuesMemo.get(data)!;
    const res = data.slice(0, n).map(x => x.y);
    this.spValuesMemo.set(data, res);
    return res;
  }

  constructor(private dash: DashboardService) {}

  ngOnInit(): void {
    this.loadFilters();

    // Default range: dataset window (matches the sample DW dates)
    const from = new Date(2011, 0, 1);   // 01-01-2011
    const to   = new Date(2014, 11, 30); // 30-12-2014
    
    const fStr = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}-01`;
    const tStr = `${to.getFullYear()}-${String(to.getMonth()+1).padStart(2,'0')}-30`;
    
    this.form.patchValue({ from: fStr, to: tStr });
  }

  private toQuery(): DashboardQuery {
    const v = this.form.value;
    return {
      from: v.from ? new Date(v.from) : null,
      to: v.to ? new Date(v.to) : null,
      territoryId: v.territoryId,
      territoryGroup: v.territoryGroup,
      salesPersonId: v.salesPersonId,
      shipMethodId: v.shipMethodId,
      category: v.category,
      subCategory: v.subCategory,
      currencyCode: v.currencyCode,
      online: v.online === null ? null : v.online === 'true'
    };
  }

  apply(): void {
    // invalidate caches and reload current tab
    this.overview = null;
    this.products = null;
    this.customers = null;
    this.salesTeam = null;
    this.shipping = null;
    this.details = null;
    this.detailPage = 1;
    this.bdLabelsMemo.clear();
    this.bdValuesMemo.clear();
    this.spLabelsMemo.clear();
    this.spValuesMemo.clear();
    this.loadActive();
  }

  clear(): void {
    this.form.reset();
    this.apply();
  }

  tabChanged(i: number): void {
    this.activeTab = i;
    this.loadActive();
  }

  nextDetails(delta: number): void {
    const maxPage = this.details ? Math.max(1, Math.ceil(this.details.total / this.details.pageSize)) : 1;
    this.detailPage = Math.min(maxPage, Math.max(1, this.detailPage + delta));
    this.loadDetails();
  }

  private loadActive(): void {
    if (this.activeTab === 0) this.loadOverview();
    if (this.activeTab === 1) this.loadProducts();
    if (this.activeTab === 2) this.loadCustomers();
    if (this.activeTab === 3) this.loadSalesTeam();
    if (this.activeTab === 4) this.loadShipping();
  }

  private loadFilters(): void {
    this.loadingFilters = true;
    this.dash.getFilters().subscribe({
      next: f => {
        this.filters = f;
        this.loadingFilters = false;
        this.loadActive();
      },
      error: err => {
        this.error = err?.message ?? 'Failed to load dashboard filters';
        this.loadingFilters = false;
      }
    });
  }

  private loadOverview(): void {
    if (this.overview) return;
    this.loadingOverview = true;
    this.dash.getOverview(this.toQuery()).subscribe({
      next: d => { this.overview = d; this.loadingOverview = false; },
      error: err => { this.error = err?.message ?? 'Failed to load overview'; this.loadingOverview = false; }
    });
  }

  private loadProducts(): void {
    if (this.products) return;
    this.loadingProducts = true;
    this.dash.getProducts(this.toQuery()).subscribe({
      next: d => { this.products = d; this.loadingProducts = false; },
      error: err => { this.error = err?.message ?? 'Failed to load products analytics'; this.loadingProducts = false; }
    });
  }

  private loadCustomers(): void {
    if (this.customers) return;
    this.loadingCustomers = true;
    this.dash.getCustomers(this.toQuery()).subscribe({
      next: d => { this.customers = d; this.loadingCustomers = false; },
      error: err => { this.error = err?.message ?? 'Failed to load customer analytics'; this.loadingCustomers = false; }
    });
  }

  private loadSalesTeam(): void {
    if (this.salesTeam) return;
    this.loadingSalesTeam = true;
    this.dash.getSalesTeam(this.toQuery()).subscribe({
      next: d => { this.salesTeam = d; this.loadingSalesTeam = false; },
      error: err => { this.error = err?.message ?? 'Failed to load sales team analytics'; this.loadingSalesTeam = false; }
    });
  }

  private loadShipping(): void {
    if (this.shipping) return;
    this.loadingShipping = true;
    this.dash.getShipping(this.toQuery()).subscribe({
      next: d => { this.shipping = d; this.loadingShipping = false; },
      error: err => { this.error = err?.message ?? 'Failed to load shipping analytics'; this.loadingShipping = false; }
    });
  }

  private loadDetails(): void {
    this.loadingDetails = true;
    this.dash.getDetails(this.toQuery(), this.detailPage, this.detailPageSize).subscribe({
      next: d => { this.details = d; this.loadingDetails = false; },
      error: err => { this.error = err?.message ?? 'Failed to load detail explorer'; this.loadingDetails = false; }
    });
  }

  fmtMoney(v: number | null | undefined): string {
    if (v === null || v === undefined) return '';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  }

  fmtDate(s: string | null | undefined): string {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  }
}
