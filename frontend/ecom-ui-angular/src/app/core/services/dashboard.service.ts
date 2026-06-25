import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../api.config';

export type NamedItem = { id: string; name: string };

export type DashboardFilters = {
  territories: NamedItem[];
  territoryGroups: NamedItem[];
  salesPeople: NamedItem[];
  shipMethods: NamedItem[];
  productCategories: NamedItem[];
  productSubCategories: NamedItem[];
  currencies: NamedItem[];
};

export type Kpi = { key: string; label: string; value: number; unit?: string | null };
export type SeriesPoint = { x: string; y: number };
export type BreakdownItem = { key: string; label: string; value: number; share?: number | null };

export type OverviewDto = {
  kpis: Kpi[];
  revenueTrend: SeriesPoint[];
  revenueByCategory: BreakdownItem[];
  revenueByTerritory: BreakdownItem[];
  topProducts: BreakdownItem[];
};

export type ProductScatter = {
  productId: string;
  productName: string;
  category: string;
  units: number;
  revenue: number;
  marginPct: number;
};

export type ProductsDto = {
  kpis: Kpi[];
  categoryMatrix: BreakdownItem[];
  scatter: ProductScatter[];
  discountBands: BreakdownItem[];
};

export type CustomerTop = {
  customerId: string;
  customerName: string;
  orders: number;
  revenue: number;
  lastOrderDate?: string | null;
};

export type CustomersDto = {
  kpis: Kpi[];
  revenueDistribution: BreakdownItem[];
  topCustomers: CustomerTop[];
  customerTrend: SeriesPoint[];
};

export type SalesQuota = {
  salesPersonId: string;
  salesPersonName: string;
  revenue: number;
  quota?: number | null;
};

export type HeatCell = { rowKey: string; colKey: string; value: number };

export type SalesTeamDto = {
  kpis: Kpi[];
  leaderboard: BreakdownItem[];
  quota: SalesQuota[];
  territoryHeat: HeatCell[];
};

export type ShippingDto = {
  kpis: Kpi[];
  leadTimeByShipMethod: BreakdownItem[];
  freightByShipMethod: BreakdownItem[];
  leadTimeByTerritory: BreakdownItem[];
};

export type DetailRow = {
  salesOrderDetailId: number;
  salesOrderId?: number | null;
  orderDate?: string | null;
  shipDate?: string | null;
  customer?: string | null;
  product?: string | null;
  category?: string | null;
  territory?: string | null;
  country?: string | null;
  salesPerson?: string | null;
  shipMethod?: string | null;
  qty?: number | null;
  unitPrice?: number | null;
  discount?: number | null;
  lineTotal?: number | null;
};

export type PagedResult<T> = { items: T[]; page: number; pageSize: number; total: number };

export type DashboardQuery = {
  from?: Date | null;
  to?: Date | null;
  territoryId?: string | null;
  territoryGroup?: string | null;
  salesPersonId?: string | null;
  shipMethodId?: string | null;
  category?: string | null;
  subCategory?: string | null;
  currencyCode?: string | null;
  online?: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = `${environment.apiBaseUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  getFilters(): Observable<DashboardFilters> {
    return this.http.get<DashboardFilters>(`${this.base}/filters`);
  }

  getOverview(q: DashboardQuery): Observable<OverviewDto> {
    return this.http.get<OverviewDto>(`${this.base}/overview`, { params: this.toParams(q) });
  }

  getProducts(q: DashboardQuery): Observable<ProductsDto> {
    return this.http.get<ProductsDto>(`${this.base}/products`, { params: this.toParams(q) });
  }

  getCustomers(q: DashboardQuery): Observable<CustomersDto> {
    return this.http.get<CustomersDto>(`${this.base}/customers`, { params: this.toParams(q) });
  }

  getSalesTeam(q: DashboardQuery): Observable<SalesTeamDto> {
    return this.http.get<SalesTeamDto>(`${this.base}/sales-team`, { params: this.toParams(q) });
  }

  getShipping(q: DashboardQuery): Observable<ShippingDto> {
    return this.http.get<ShippingDto>(`${this.base}/shipping`, { params: this.toParams(q) });
  }

  getDetails(q: DashboardQuery, page = 1, pageSize = 50): Observable<PagedResult<DetailRow>> {
    let params = this.toParams(q);
    params = params.set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<DetailRow>>(`${this.base}/details`, { params });
  }

  private toParams(q: DashboardQuery): HttpParams {
    let p = new HttpParams();

    const set = (k: string, v: any) => {
      if (v === undefined || v === null || v === '') return;
      p = p.set(k, v);
    };

    set('from', q.from ? q.from.toISOString() : null);
    set('to', q.to ? q.to.toISOString() : null);
    set('territoryId', q.territoryId);
    set('territoryGroup', q.territoryGroup);
    set('salesPersonId', q.salesPersonId);
    set('shipMethodId', q.shipMethodId);
    set('category', q.category);
    set('subCategory', q.subCategory);
    set('currencyCode', q.currencyCode);
    if (q.online !== undefined && q.online !== null) set('online', q.online);

    return p;
  }
}
