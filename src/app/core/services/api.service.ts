import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  
  // Timeout for file downloads (2 minutes - PDF generation can take time)
  private readonly DOWNLOAD_TIMEOUT = 120000;

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      params: this.toHttpParams(params),
    });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string, body?: unknown): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, body !== undefined ? { body } : undefined);
  }
  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }
  /**
   * Download a file as Blob (for PDF downloads, etc.)
   * Includes timeout handling and error formatting
   */
  getBlob(path: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, {
      params: this.toHttpParams(params),
      responseType: 'blob',
    }).pipe(
      timeout(this.DOWNLOAD_TIMEOUT),
      catchError((error: HttpErrorResponse | Error) => this.handleBlobError(error))
    );
  }

  /**
   * Handle blob download errors with user-friendly messages
   */
  private handleBlobError(error: HttpErrorResponse | Error): Observable<never> {
    let message = 'Erreur lors du téléchargement du fichier';
    
    if (error.name === 'TimeoutError') {
      message = 'Le téléchargement a pris trop de temps. Veuillez réessayer.';
    } else if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else if (error.status === 404) {
        message = 'Le fichier demandé n\'existe pas.';
      } else if (error.status === 403) {
        message = 'Vous n\'avez pas accès à ce fichier.';
      } else if (error.status >= 500) {
        message = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }
    
    return throwError(() => new Error(message));
  }

  private toHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
