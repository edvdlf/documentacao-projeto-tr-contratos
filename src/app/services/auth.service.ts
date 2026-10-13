import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagina } from '../models/admin.models';

export type PerfilUsuario = 'ADMIN' | 'USUARIO';

export interface AuthUser {
  id: string;
  /** Login usado na API (antes chamado `usuario` nas telas). */
  usuario: string;
  nome: string;
  perfil: PerfilUsuario;
}

export interface AcessoHistorico {
  id: string;
  usuarioId: string | null;
  usuario: string;
  nome: string;
  /** ISO 8601 — data e hora do login */
  ocorridoEm: string;
}

interface LoginApiResponse {
  id: string;
  login: string;
  nome: string;
  perfil: PerfilUsuario;
}

interface AcessoApiResponse {
  id: string;
  usuarioId: string | null;
  login: string;
  nome: string;
  ocorridoEm: string;
}

const STORAGE_KEY = 'vetorit.auth-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  private readonly usuarioAtual = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this.usuarioAtual.asReadonly();
  readonly isAuthenticated = computed(() => this.usuarioAtual() !== null);
  readonly isAdmin = computed(() => this.usuarioAtual()?.perfil === 'ADMIN');

  /** Autentica na API e grava a sessão no navegador. Em caso de erro, emite `null`. */
  login(usuario: string, senha: string): Observable<AuthUser | null> {
    return this.http
      .post<LoginApiResponse>(`${this.base}/auth/login`, {
        login: usuario.trim(),
        senha,
      })
      .pipe(
        map((res) => ({
          id: res.id,
          usuario: res.login,
          nome: res.nome,
          perfil: res.perfil,
        })),
        tap((session) => {
          this.usuarioAtual.set(session);
          this.persistUser(session);
        }),
        catchError(() => of(null)),
      );
  }

  logout(): void {
    this.usuarioAtual.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  listarAcessos(page = 0, size = 100): Observable<Pagina<AcessoHistorico>> {
    return this.http
      .get<Pagina<AcessoApiResponse>>(`${this.base}/acessos`, {
        params: { page, size, sort: 'ocorridoEm', direction: 'DESC' },
      })
      .pipe(
        map((pagina) => ({
          ...pagina,
          content: pagina.content.map((a) => ({
            id: a.id,
            usuarioId: a.usuarioId,
            usuario: a.login,
            nome: a.nome,
            ocorridoEm: a.ocorridoEm,
          })),
        })),
      );
  }

  limparHistorico(): Observable<void> {
    return this.http.delete<void>(`${this.base}/acessos`);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthUser;
      if (!parsed?.id || !parsed?.usuario || !parsed?.nome) return null;
      if (parsed.perfil !== 'ADMIN' && parsed.perfil !== 'USUARIO') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persistUser(user: AuthUser): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }
}
