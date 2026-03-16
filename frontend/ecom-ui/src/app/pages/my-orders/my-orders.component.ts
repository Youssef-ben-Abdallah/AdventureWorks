import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
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

  statusIcon(id: number) {
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

  statusChipStyle(id: number) {
    switch (id) {
      case 0: return { '--mdc-chip-elevated-container-color': '#fff3cd', '--mdc-chip-label-text-color': '#856404', '--mdc-chip-with-icon-icon-color': '#856404' };
      case 1: return { '--mdc-chip-elevated-container-color': '#d1ecf1', '--mdc-chip-label-text-color': '#0c5460', '--mdc-chip-with-icon-icon-color': '#0c5460' };
      case 2: return { '--mdc-chip-elevated-container-color': '#e2e3ff', '--mdc-chip-label-text-color': '#3f51b5', '--mdc-chip-with-icon-icon-color': '#3f51b5' };
      case 3: return { '--mdc-chip-elevated-container-color': '#d4edda', '--mdc-chip-label-text-color': '#155724', '--mdc-chip-with-icon-icon-color': '#155724' };
      case 4: return { '--mdc-chip-elevated-container-color': '#c3f7d0', '--mdc-chip-label-text-color': '#0f5132', '--mdc-chip-with-icon-icon-color': '#0f5132' };
      case 5: return { '--mdc-chip-elevated-container-color': '#f8d7da', '--mdc-chip-label-text-color': '#721c24', '--mdc-chip-with-icon-icon-color': '#721c24' };
      default: return { '--mdc-chip-elevated-container-color': '#e2e3e5', '--mdc-chip-label-text-color': '#383d41', '--mdc-chip-with-icon-icon-color': '#383d41' };
    }
  }
}
