import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SeriesPoint } from 'src/app/core/services/dashboard.service';

@Component({
  selector: 'app-simple-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
  <mat-card class="card">
    <div class="title">{{ title }}</div>
    <svg *ngIf="pts.length" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="none" class="svg">
      <polyline [attr.points]="poly" fill="none" stroke="currentColor" stroke-width="2" opacity="0.85"></polyline>
    </svg>
    <div class="hint" *ngIf="hint">{{ hint }}</div>
  </mat-card>
  `,
  styles: [`
    .card{padding:12px}
    .title{font-weight:700;margin-bottom:8px}
    .svg{width:100%;height:140px}
    .hint{font-size:12px;opacity:.75;margin-top:6px}
  `]
})
export class SimpleLineChartComponent {
  @Input() title = 'Trend';
  @Input() hint = '';
  @Input() series: SeriesPoint[] | null = null;

  w = 360;
  h = 140;

  get pts(): SeriesPoint[] {
    return this.series ?? [];
  }

  get poly(): string {
    const ys = this.pts.map(p => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const dx = this.pts.length <= 1 ? 0 : this.w / (this.pts.length - 1);
    return this.pts
      .map((p, i) => {
        const x = i * dx;
        const y = this.scale(p.y, min, max);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private scale(v: number, min: number, max: number): number {
    if (max === min) return this.h / 2;
    const t = (v - min) / (max - min);
    return (1 - t) * (this.h - 8) + 4;
  }
}
