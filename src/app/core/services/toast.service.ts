import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string, action = '', config?: MatSnackBarConfig): void {
    this.open(message, action, 'success', config);
  }

  warning(message: string, action = '', config?: MatSnackBarConfig): void {
    this.open(message, action, 'warning', config);
  }

  error(message: string, action = '', config?: MatSnackBarConfig): void {
    this.open(message, action, 'error', config);
  }

  info(message: string, action = '', config?: MatSnackBarConfig): void {
    this.open(message, action, 'info', config);
  }

  open(
    message: string,
    action = '',
    type: ToastType = 'info',
    config?: MatSnackBarConfig,
  ): void {
    const typeClass = `toast-${type}`;

    const existing = (config?.panelClass ?? []) as string | string[];
    const existingClasses = Array.isArray(existing) ? existing : [existing];

    const finalConfig: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [typeClass, ...existingClasses].filter(Boolean),
      ...config,
    };

    this.snackBar.open(message, action, finalConfig);
  }
}
