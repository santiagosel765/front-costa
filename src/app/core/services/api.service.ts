import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type PrimitiveParam = string | number | boolean;
type ParamValue = PrimitiveParam | ReadonlyArray<PrimitiveParam>;
type ParamRecord = Record<string, ParamValue>;

interface BaseOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | ParamRecord;
  reportProgress?: boolean;
  withCredentials?: boolean;
  context?: HttpContext;
  observe?: 'body';
}

/** Opciones válidas para respuestas JSON (genéricas <T>) */
export interface HttpOptionsJson extends BaseOptions {
  responseType?: 'json'; // por defecto
}

/** Opciones para descargas / no-JSON */
export interface HttpOptionsBlob extends BaseOptions {
  responseType: 'blob';
}
export interface HttpOptionsArrayBuffer extends BaseOptions {
  responseType: 'arraybuffer';
}
export interface HttpOptionsText extends BaseOptions {
  responseType: 'text';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  // ---------- JSON (genérico) ----------
  get<T>(endpoint: string, options: HttpOptionsJson = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.get<T>(url, { observe: 'body', responseType: 'json', ...options });
  }

  post<T>(endpoint: string, body: unknown, options: HttpOptionsJson = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.post<T>(url, body, { observe: 'body', responseType: 'json', ...options });
  }

  put<T>(endpoint: string, body: unknown, options: HttpOptionsJson = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.put<T>(url, body, { observe: 'body', responseType: 'json', ...options });
  }

  delete<T>(endpoint: string, options: HttpOptionsJson = {}): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.delete<T>(url, { observe: 'body', responseType: 'json', ...options });
  }

  // ---------- No-JSON (helpers dedicados) ----------
  getBlob(endpoint: string, options: Omit<HttpOptionsBlob, 'observe'> = { responseType: 'blob' }): Observable<Blob> {
    const url = this.buildUrl(endpoint);
    return this.http.get(url, { observe: 'body', ...options });
  }

  getArrayBuffer(
    endpoint: string,
    options: Omit<HttpOptionsArrayBuffer, 'observe'> = { responseType: 'arraybuffer' }
  ): Observable<ArrayBuffer> {
    const url = this.buildUrl(endpoint);
    return this.http.get(url, { observe: 'body', ...options });
  }

  getText(endpoint: string, options: Omit<HttpOptionsText, 'observe'> = { responseType: 'text' }): Observable<string> {
    const url = this.buildUrl(endpoint);
    return this.http.get(url, { observe: 'body', ...options });
  }
}
