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
    .card{
      padding:1.25rem;
      padding-bottom:1.5rem;
      height:100%;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      box-sizing:border-box;
      border-radius: 16px;
      background: linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9));
      border: 1px solid rgba(255,255,255,0.05);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    :host-context([data-theme="light"]) .card {
      background: #ffffff;
      border: 1px solid rgba(99,102,241,0.2);
      box-shadow: 0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.05);
      backdrop-filter: none;
    }
    .head{display:flex;flex-direction:column;gap:2px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.05);}
    :host-context([data-theme="light"]) .head{border-bottom-color:rgba(99,102,241,0.1);}
    .title{font-weight:700;line-height:1.15;color:#f1f5f9;font-family:'Space Grotesk',sans-serif;font-size:1rem;}
    :host-context([data-theme="light"]) .title{color:#0f172a;}
    .meta{font-size:12px;color:#94a3b8;margin-top:2px;}
    :host-context([data-theme="light"]) .meta{color:#64748b;}
    .canvasWrap{flex:1; min-height:220px; position:relative;}
    .canvasWrap.tight{min-height:180px;}
    canvas{display:block; width:100% !important; height:100% !important;}
    .hint{font-size:11px;color:#64748b;margin-top:8px;}
    :host-context([data-theme="light"]) .hint{color:#94a3b8;}
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
                'rgba(99, 102, 241, 0.7)',
                'rgba(6, 182, 212, 0.7)',
                'rgba(244, 63, 94, 0.7)',
                'rgba(234, 179, 8, 0.7)',
                'rgba(168, 85, 247, 0.7)',
                'rgba(16, 185, 129, 0.7)'
              ],
              borderColor: [
                '#6366f1',
                '#06b6d4',
                '#f43f5e',
                '#eab308',
                '#a855f7',
                '#10b981'
              ],
              borderWidth: 1.5,
              fill: true
            },
          ],
        };
      }
    }

    if (changes['type'] || changes['showLegend'] || changes['xAxisLabel'] || changes['yAxisLabel'] || changes['valueFormat']) {
      const isCartesian = this.type === 'bar' || this.type === 'line' || this.type === 'scatter';
      // Adaptive color: dark mode uses lighter muted, light mode uses darker text
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const tickColor  = isLight ? '#475569' : '#94a3b8';
      const gridColor  = isLight ? 'rgba(99,102,241,0.08)' : 'rgba(148,163,184,0.1)';
      const labelColor = isLight ? '#334155' : '#94a3b8';

      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: {
          padding: { bottom: 30 }
        },
        plugins: {
          legend: { display: this.showLegend, labels: { color: labelColor, font: { family: 'Inter, sans-serif', size: 12 } } },
          tooltip: {
            backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.95)',
            titleColor: isLight ? '#0f172a' : '#f1f5f9',
            bodyColor: isLight ? '#334155' : '#94a3b8',
            borderColor: isLight ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.3)',
            borderWidth: 1,
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
                title: { display: !!this.xAxisLabel, text: this.xAxisLabel, color: labelColor, font: { family: 'Space Grotesk, sans-serif', size: 11 } },
                ticks: { maxRotation: 0, autoSkip: true, color: tickColor, font: { family: 'Inter, sans-serif', size: 11 } },
                grid: { display: false },
                border: { color: gridColor },
              },
              y: {
                title: { display: !!this.yAxisLabel, text: this.yAxisLabel, color: labelColor, font: { family: 'Space Grotesk, sans-serif', size: 11 } },
                ticks: {
                  color: tickColor,
                  font: { family: 'Inter, sans-serif', size: 11 },
                  callback: (value: any) => this.fmtTick(value),
                },
                grid: { color: gridColor },
                border: { color: gridColor },
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
