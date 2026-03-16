import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { Order } from '../../core/models';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-order-ticket-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatDividerModule, MatButtonModule, MatChipsModule],
  templateUrl: './order-ticket-dialog.component.html',
  styleUrls: ['./order-ticket-dialog.component.css']
})
export class OrderTicketDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { order: Order }) {}

  get o() { return this.data.order; }

  subTotal(): number {
    return (this.o.items ?? []).reduce((s, i) => s + (i.lineTotal ?? (i.qty * i.unitPrice)), 0);
  }

  statusLabel(status: number | string): string {
    const id = typeof status === 'string' ? Number(status) : status;
    switch (id) {
      case 0: return 'Pending';
      case 1: return 'Paid';
      case 2: return 'Processing';
      case 3: return 'Shipped';
      case 4: return 'Delivered';
      case 5: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  statusChipStyle(status: number | string) {
    const id = typeof status === 'string' ? Number(status) : status;
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

  statusIcon(status: number | string): string {
    const id = typeof status === 'string' ? Number(status) : status;
    switch (id) {
      case 0: return 'hourglass_empty';
      case 1: return 'paid';
      case 2: return 'autorenew';
      case 3: return 'local_shipping';
      case 4: return 'check_circle';
      case 5: return 'cancel';
      default: return 'help';
    }
  }
}