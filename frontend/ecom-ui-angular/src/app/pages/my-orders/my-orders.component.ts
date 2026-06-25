import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error = '';

  constructor(private ordersSvc: OrdersService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ordersSvc.myOrders().subscribe({
      next: rows => { this.orders = rows; this.loading = false; },
      error: err => { this.error = err?.error ?? err?.message ?? 'Failed'; this.loading = false; }
    });
  }

  statusLabel(id: number) {
    return ['Pending','Paid','Processing','Shipped','Delivered','Cancelled'][id] ?? 'Unknown';
  }

  statusIcon(id: number): string {
    switch (id) {
      case 0: return 'schedule';
      case 1: return 'paid';
      case 2: return 'autorenew';
      case 3: return 'local_shipping';
      case 4: return 'check_circle';
      case 5: return 'cancel';
      default: return 'help';
    }
  }

  statusClass(id: number): string {
    switch (id) {
      case 0: return 'status-pending';
      case 1: return 'status-paid';
      case 2: return 'status-processing';
      case 3: return 'status-shipped';
      case 4: return 'status-delivered';
      case 5: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }
}
