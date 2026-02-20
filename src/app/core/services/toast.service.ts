import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.open(message, action, 'success', config);
  }

  warning(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.open(message, action, 'warning', config);
  }

  error(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.open(message, action, 'error', config);
  }

  info(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.open(message, action, 'info', config);
  }

  open(
    message: string,
    action = 'OK',
    type: ToastType = 'info',
    config?: MatSnackBarConfig,
  ): void {
    const finalConfig: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`toast-${type}`],
      ...config,
    };

    this.snackBar.open(message, action, finalConfig);
  }
}

