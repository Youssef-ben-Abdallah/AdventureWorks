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
    <div class="kpi" *ngFor="let k of kpis">
      <div class="kpi-icon"><span class="material-icons">bar_chart</span></div>
      <div>
        <div class="label">{{ k.label }}</div>
        <div class="value">{{ format(k.value, k.unit) }}</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(140px,1fr));gap:1rem;align-items:stretch;margin-bottom:2rem;}
    .kpi{
      padding:1.5rem;
      border-radius:16px;
      background: linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9));
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .kpi:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.25); }
    .kpi-icon{
      width: 48px; height: 48px; border-radius: 12px; flex-shrink:0;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon .material-icons { font-size:22px; color:white; }
    .label{font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:0.3rem;}
    .value{font-size:1.65rem;font-weight:700;line-height:1.1;color:#f8fafc;font-family:'Space Grotesk',sans-serif;}
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
