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

        const apiMessage = this.extractApiMessage(err);

        const apiError: ApiError = {
          status: err.status,
          message: apiMessage ?? this.toMessage(err),
          details: err.error,
          url: err.url ?? undefined,
        };

        // UX: toast centralisé
        this.toast.error(apiError.message);

        // Navigation selon code
        if (apiError.status === 401) {
          let message = apiError.message ?? 'Votre session a expiré. Veuillez vous reconnecter.';
          this.router.navigateByUrl('/auth/login');
          this.toast.warning(message);
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

  private extractApiMessage(err: HttpErrorResponse): string | null {
    // Très fréquent avec Express/Nest: { message: '...' }
    const body: any = err.error;

    if (!body) return null;

    // Si le backend renvoie juste du texte
    if (typeof body === 'string') {
      const s = body.trim();
      return s.length ? s : null;
    }

    // JSON classique
    if (typeof body === 'object') {
      const msg = body.message ?? body.error ?? body.msg;
      if (typeof msg === 'string' && msg.trim().length) return msg.trim();

      // Parfois: { errors: [{ message: '...' }] }
      const first = Array.isArray(body.errors) ? body.errors[0] : null;
      if (first && typeof first.message === 'string' && first.message.trim().length) {
        return first.message.trim();
      }
    }

    return null;
  }

  private toMessage(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      case 400:
        return 'Votre requête est invalide. Vérifiez les données envoyées.';
      case 401:
        return 'Email ou mot de passe incorrect.';
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
