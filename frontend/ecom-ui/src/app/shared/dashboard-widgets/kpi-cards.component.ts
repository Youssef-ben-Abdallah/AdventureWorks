import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Kpi } from 'src/app/core/services/dashboard.service';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
  <div class="kpi-grid" *ngIf="kpis?.length">
    <mat-card class="kpi" *ngFor="let k of kpis">
      <div class="label">{{ k.label }}</div>
      <div class="value">{{ format(k.value, k.unit) }}</div>
    </mat-card>
  </div>
  `,
  styles: [`
    .kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(140px,1fr));gap:12px;align-items:stretch}
    .kpi{padding:12px}
    .label{font-size:12px;opacity:.75}
    .value{font-size:22px;font-weight:700;margin-top:6px;line-height:1.1}
    @media (max-width:1200px){.kpi-grid{grid-template-columns:repeat(3,minmax(140px,1fr));}}
    @media (max-width:700px){.kpi-grid{grid-template-columns:repeat(2,minmax(140px,1fr));}}
  `]
})
export class KpiCardsComponent {
  @Input() kpis: Kpi[] | null = null;

  format(v: number, unit?: string | null): string {
    if (unit === '%') return `${v.toFixed(1)}%`;
    if (unit === 'days') return `${v.toFixed(1)} days`;
    if (unit === '$') return this.money(v);
    if (!unit) return this.compact(v);
    return `${this.compact(v)} ${unit}`;
  }

  private money(v: number): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  }
  private compact(v: number): string {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  }
}
