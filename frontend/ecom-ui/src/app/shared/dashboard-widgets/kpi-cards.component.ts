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
    <div class="kpi glass" *ngFor="let k of kpis">
      <div class="label">{{ k.label }}</div>
      <div class="value text-glow-cyan">{{ format(k.value, k.unit) }}</div>
    </div>
  </div>
  `,
  styles: [`
    .kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(140px,1fr));gap:1rem;align-items:stretch}
    .kpi{padding:1.25rem; border-radius:16px; border: 1px solid rgba(6,182,212,0.2); transition: transform 0.2s, box-shadow 0.2s;}
    .kpi:hover { transform: translateY(-3px); box-shadow: 0 0 20px rgba(6,182,212,0.2); }
    .label{font-size:0.75rem;font-weight:600;opacity:.75;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted)}
    .value{font-size:1.75rem;font-weight:700;margin-top:0.5rem;line-height:1.1;color:var(--text-primary)}
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
