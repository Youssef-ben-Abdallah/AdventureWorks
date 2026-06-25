import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BreakdownItem } from 'src/app/core/services/dashboard.service';

@Component({
  selector: 'app-simple-bar-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
  <mat-card class="card">
    <div class="title">{{ title }}</div>
    <div class="bars" *ngIf="items.length">
      <div class="row" *ngFor="let it of items">
        <div class="label" [title]="it.label">{{ it.label }}</div>
        <div class="bar">
          <div class="fill" [style.width.%]="pct(it.value)"></div>
        </div>
        <div class="val">{{ fmt(it.value) }}</div>
      </div>
    </div>
    <div class="hint" *ngIf="hint">{{ hint }}</div>
  </mat-card>
  `,
  styles: [`
    .card{padding:12px}
    .title{font-weight:700;margin-bottom:8px}
    .bars{display:flex;flex-direction:column;gap:8px}
    .row{display:grid;grid-template-columns: 180px 1fr 90px;gap:10px;align-items:center}
    .label{font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bar{height:10px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden}
    .fill{height:100%;background:currentColor;opacity:.65}
    .val{font-size:12px;text-align:right;opacity:.85}
    .hint{font-size:12px;opacity:.75;margin-top:8px}
    @media (max-width:800px){.row{grid-template-columns: 140px 1fr 80px;}}
  `]
})
export class SimpleBarChartComponent {
  @Input() title = 'Breakdown';
  @Input() hint = '';
  @Input() data: BreakdownItem[] | null = null;

  get items(): BreakdownItem[] {
    return (this.data ?? []).slice(0, 12);
  }

  private get max(): number {
    return Math.max(1, ...this.items.map(x => x.value));
  }

  pct(v: number): number {
    return (v / this.max) * 100;
  }

  fmt(v: number): string {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  }
}
