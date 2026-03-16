import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../api.config';
import { AuthResponse } from '../models';
import { BehaviorSubject, map, tap } from 'rxjs';

type LoginDto = { username: string; password: string; };
type RegisterDto = { username: string; email: string; password: string; };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'ecom_token';
  private readonly rolesKey = 'ecom_roles';
  private readonly userKey = 'ecom_user';

  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this._isLoggedIn$.asObservable();

  private _username$ = new BehaviorSubject<string>(this.getStoredUsername());
  username$ = this._username$.asObservable();

  constructor(private http: HttpClient) {}

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/login`, dto).pipe(
      tap(res => this.storeAuth(res)),
      tap(() => this._isLoggedIn$.next(true)),
      map(() => void 0)
    );
  }

  register(dto: RegisterDto) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/register`, dto).pipe(
      tap(res => this.storeAuth(res)),
      tap(() => this._isLoggedIn$.next(true)),
      map(() => void 0)
    );
  }

  logout() {
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem(this.userKey);
    this._isLoggedIn$.next(false);
    this._username$.next('');
  }

  getUsername(): string {
    return this.getStoredUsername();
  }

  getToken(): string | null {
    return localStorage.getItem(this.key);
  }

  getRoles(): string[] {
    try { return JSON.parse(localStorage.getItem(this.rolesKey) ?? '[]'); }
    catch { return []; }
  }

  isAdmin(): boolean {
    return this.getRoles().includes('Admin');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.key);
  }

  private storeAuth(res: AuthResponse) {
    localStorage.setItem(this.key, res.token);
    localStorage.setItem(this.rolesKey, JSON.stringify(res.roles ?? []));
    localStorage.setItem(this.userKey, res.username ?? '');
    this._username$.next(res.username ?? '');
  }

  private getStoredUsername(): string {
    return localStorage.getItem(this.userKey) ?? '';
  }
}
