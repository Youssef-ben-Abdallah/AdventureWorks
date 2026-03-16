import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartData,
  ChartEvent,
  ChartType,
  TooltipItem,
} from 'chart.js';

/**
 * Reusable Chart.js card with sensible defaults for analytics:
 * - responsive
 * - axes labels for cartesian charts
 * - tooltips show label + formatted value
 */
@Component({
  selector: 'app-chartjs-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule],
  template: `
  <mat-card class="card">
    <div class="head">
      <div class="title">{{ title }}</div>
      <div class="meta" *ngIf="sub">{{ sub }}</div>
    </div>

    <div class="canvasWrap" [class.tight]="compact">
      <canvas
        baseChart
        [type]="type"
        [data]="data"
        [options]="options"
        [legend]="showLegend"
      ></canvas>
    </div>

    <div class="hint" *ngIf="hint">{{ hint }}</div>
  </mat-card>
  `,
  styles: [`
    /*
      Prevent layout shift on hover:
      - Force a stable box model for the mat-card.
      - Clip any overflow so tooltips/labels never trigger scrollbars or reflow.
    */
    .card{padding:1px; height:100%; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box;}
    .head{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}
    .title{font-weight:800;line-height:1.15}
    .meta{font-size:12px;opacity:.75}
    .canvasWrap{flex:1; min-height:280px; position:relative; overflow:hidden;}
    .canvasWrap.tight{min-height:220px;}
    canvas{display:block; width:100% !important; height:100% !important;}
    .hint{font-size:12px;opacity:.75;margin-top:8px}
  `]
})
export class ChartJsCardComponent {
  @Input() title = 'Chart';
  @Input() sub = '';
  @Input() hint = '';
  @Input() compact = false;

  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() datasetLabel = '';
  @Input() values: number[] = [];

  /** For multi-series charts (optional) */
  @Input() datasets?: ChartData['datasets'];

  @Input() xAxisLabel = '';
  @Input() yAxisLabel = '';

  @Input() showLegend = false;

  @Input() valueFormat: 'compact' | 'money' | 'percent' | 'integer' = 'compact';

  get data(): ChartData {
    if (this.datasets?.length) {
      return { labels: this.labels, datasets: this.datasets };
    }

    return {
      labels: this.labels,
      datasets: [
        {
          label: this.datasetLabel,
          data: this.values,
        },
      ],
    };
  }

  get options(): ChartConfiguration['options'] {
    const isCartesian = this.type === 'bar' || this.type === 'line' || this.type === 'scatter';

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: this.showLegend },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<any>) => {
              const label = ctx.dataset?.label ? `${ctx.dataset.label}: ` : '';
              const v = (ctx.parsed?.y ?? ctx.parsed) as any;
              return label + this.fmtNumber(Number(v));
            },
          },
        },
      },
      scales: isCartesian
        ? {
            x: {
              title: { display: !!this.xAxisLabel, text: this.xAxisLabel },
              ticks: { maxRotation: 0, autoSkip: true },
              grid: { display: false },
            },
            y: {
              title: { display: !!this.yAxisLabel, text: this.yAxisLabel },
              ticks: {
                callback: (value: any) => this.fmtTick(value),
              },
            },
          }
        : undefined,
    };
  }

  private fmtTick(v: any): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    return this.valueFormat === 'percent'
      ? `${(n * 100).toFixed(0)}%`
      : this.valueFormat === 'integer'
        ? new Intl.NumberFormat(undefined).format(Math.round(n))
        : this.valueFormat === 'money'
          ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
          : new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }

  private fmtNumber(n: number): string {
    if (!Number.isFinite(n)) return '0';
    switch (this.valueFormat) {
      case 'percent':
        return `${(n * 100).toFixed(1)}%`;
      case 'integer':
        return new Intl.NumberFormat(undefined).format(Math.round(n));
      case 'money':
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
      default:
        return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(n);
    }
  }
}
