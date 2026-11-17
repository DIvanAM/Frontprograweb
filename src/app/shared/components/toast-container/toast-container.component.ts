import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.type" role="alert">
          <div class="toast-content">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p class="toast-msg">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="toast-close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100% - 40px);
    }

    .toast-item {
      background: #ffffff;
      border: 1px solid var(--color-border);
      border-left-width: 4px;
      border-radius: 8px;
      padding: 12px 14px;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      animation: slideIn 0.2s ease-out;
    }

    .toast-success { border-left-color: var(--color-success); }
    .toast-error { border-left-color: var(--color-danger); }
    .toast-warning { border-left-color: var(--color-warning); }
    .toast-info { border-left-color: var(--color-info); }

    .toast-title {
      display: block;
      font-size: 0.85rem;
      color: var(--color-text);
      margin-bottom: 2px;
    }

    .toast-msg {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      line-height: 1;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0 2px;
    }

    @keyframes slideIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
