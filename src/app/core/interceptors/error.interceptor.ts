import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiError } from '../models/api-error.model';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) {
          return throwError(() => err);
        }

        const apiError: ApiError = {
          status: err.status,
          message: err.message || this.toMessage(err),
          details: err.error,
          url: err.url ?? undefined,
        };

        // UX: toast centralisé
        this.toast.error(apiError.message);

        // Navigation selon code
        if (apiError.status === 403) {
          this.router.navigateByUrl('/auth/login');
          this.toast.warning('Votre session a expiré. Veuillez vous reconnecter.');
        } else if (apiError.status === 404) {
          this.toast.warning(apiError.message);

          if (window.history.length > 1) {
            window.history.back();
          } else {
            this.router.navigateByUrl('/');
          }
        }

        return throwError(() => apiError);
      }),
    );
  }

  private toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      case 400:
        return 'Votre requête est invalide. Vérifiez les données envoyées.';
      case 403:
        return 'Vous n\'êtes pas autorisé à accéder à cette ressource.';
      case 404:
        return 'Cette ressource est introuvable.';
      case 500:
        return 'Nous avons rencontré une erreur côté serveur. Veuillez réessayer plus tard.';
      default:
        return err.message || `Une erreur inattendue est survenue (code ${err.status}).`;
    }
  }
}
