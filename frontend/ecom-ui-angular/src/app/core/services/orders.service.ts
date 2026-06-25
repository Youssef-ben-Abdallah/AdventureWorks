import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../api.config';
import { Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private http: HttpClient) {}

  myOrders() { return this.http.get<Order[]>(`${environment.apiBaseUrl}/api/orders/mine`); }
  allOrders() { return this.http.get<Order[]>(`${environment.apiBaseUrl}/api/orders`); }

  createOrder(payload: any) {
    return this.http.post<Order>(`${environment.apiBaseUrl}/api/orders`, payload);
  }

  updateStatus(id: number, status: number) {
    return this.http.patch<void>(`${environment.apiBaseUrl}/api/orders/${id}/status`, { status });
  }
}
