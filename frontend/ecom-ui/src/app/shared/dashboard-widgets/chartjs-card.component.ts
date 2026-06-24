import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
  <div class="card glass">
    <div class="head">
      <div class="title">{{ title }}</div>
      <div class="meta" *ngIf="sub">{{ sub }}</div>
    </div>

    <div class="canvasWrap" [class.tight]="compact">
      <canvas
        baseChart
        [type]="type"
        [data]="chartData"
        [options]="chartOptions"
        [legend]="showLegend"
      ></canvas>
    </div>

    <div class="hint" *ngIf="hint">{{ hint }}</div>
  </div>
  `,
  styles: [`
    /*
      Prevent layout shift on hover:
      - Force a stable box model for the mat-card.
    */
    .card{padding:1.25rem; padding-bottom:1.5rem; height:100%; display:flex; flex-direction:column; overflow:hidden; box-sizing:border-box; border-radius: 16px; border: 1px solid var(--border-subtle);}
    .head{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}
    .title{font-weight:800;line-height:1.15}
    .meta{font-size:12px;opacity:.75}
    .canvasWrap{flex:1; min-height:220px; position:relative;}
    .canvasWrap.tight{min-height:180px;}
    canvas{display:block; width:100% !important; height:100% !important;}
    .hint{font-size:12px;opacity:.75;margin-top:8px}
  `]
})
export class ChartJsCardComponent implements OnChanges {
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

  chartData: ChartData = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labels'] || changes['values'] || changes['datasets'] || changes['datasetLabel']) {
      if (this.datasets?.length) {
        this.chartData = { labels: this.labels, datasets: this.datasets };
      } else {
        this.chartData = {
          labels: this.labels,
          datasets: [
            {
              label: this.datasetLabel,
              data: this.values,
              backgroundColor: [
                'rgba(99, 102, 241, 0.6)',
                'rgba(6, 182, 212, 0.6)',
                'rgba(244, 63, 94, 0.6)',
                'rgba(234, 179, 8, 0.6)',
                'rgba(168, 85, 247, 0.6)',
                'rgba(16, 185, 129, 0.6)'
              ],
              borderColor: [
                '#6366f1',
                '#06b6d4',
                '#f43f5e',
                '#eab308',
                '#a855f7',
                '#10b981'
              ],
              borderWidth: 1,
              fill: true
            },
          ],
        };
      }
    }

    if (changes['type'] || changes['showLegend'] || changes['xAxisLabel'] || changes['yAxisLabel'] || changes['valueFormat']) {
      const isCartesian = this.type === 'bar' || this.type === 'line' || this.type === 'scatter';

      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        color: '#888',
        layout: {
          padding: { bottom: 30 }
        },
        plugins: {
          legend: { display: this.showLegend, labels: { color: '#888' } },
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
                title: { display: !!this.xAxisLabel, text: this.xAxisLabel, color: '#888' },
                ticks: { maxRotation: 0, autoSkip: true, color: '#888' },
                grid: { display: false },
              },
              y: {
                title: { display: !!this.yAxisLabel, text: this.yAxisLabel, color: '#888' },
                ticks: {
                  color: '#888',
                  callback: (value: any) => this.fmtTick(value),
                },
                grid: { color: 'rgba(128,128,128,0.1)' }
              },
            }
          : undefined,
      };
    }
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
