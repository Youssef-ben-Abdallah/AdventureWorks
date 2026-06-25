import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule],
  template: `
  <mat-accordion class="acc">
    <mat-expansion-panel [expanded]="expanded">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <span class="material-icons" style="margin-right:8px">lightbulb</span>
          Why these visuals / how to read this tab
        </mat-panel-title>
      </mat-expansion-panel-header>
      <div class="content">
        <ng-container *ngFor="let n of notes">
          <div class="note">
            <div class="h">{{ n.title }}</div>
            <div class="b">{{ n.body }}</div>
          </div>
        </ng-container>
      </div>
    </mat-expansion-panel>
  </mat-accordion>
  `,
  styles: [`
    .acc{margin: 2.5rem 0; display: block;}
    .content{display:grid;gap:12px;padding-top:12px;}
    .note{padding:10px;border:1px solid var(--border-subtle);border-radius:12px;background:var(--bg-glass)}
    .h{font-weight:700;margin-bottom:4px;color:var(--text-primary)}
    .b{font-size:13px;opacity:.85;line-height:1.35;color:var(--text-dim)}
    
    ::ng-deep .mat-expansion-panel {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-glow) !important;
      border-radius: 12px !important;
    }
    ::ng-deep .mat-expansion-panel-header-title {
      color: var(--text-primary) !important;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
    }
    ::ng-deep .mat-expansion-panel-header .material-icons {
      color: var(--color-primary-bright);
    }
  `]
})
export class NotesPanelComponent {
  @Input() expanded = false;
  @Input() notes: { title: string; body: string }[] = [];
}
