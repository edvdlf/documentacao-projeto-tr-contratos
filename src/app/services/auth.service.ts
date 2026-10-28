import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

interface SessaoPersistida extends AuthUser {
  autenticadoEm: string;
}

const STORAGE_KEY = 'vetorit.auth-user';
/** Limite de segurança: mesmo no mesmo dia, a sessão não passa de 12 horas. */
const DURACAO_MAXIMA_MS = 12 * 60 * 60 * 1000;
const FUSO = 'America/Sao_Paulo';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/api`;

  private autenticadoEm: string | null = null;
  private readonly usuarioAtual = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this.usuarioAtual.asReadonly();
  readonly isAuthenticated = computed(() => this.usuarioAtual() !== null);
  readonly isAdmin = computed(() => this.usuarioAtual()?.perfil === 'ADMIN');

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.encerrarSeExpirada(true);
      }
    });
  }

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
          this.autenticadoEm = new Date().toISOString();
          this.usuarioAtual.set(session);
          this.persistUser(session, this.autenticadoEm);
        }),
        catchError(() => of(null)),
      );
  }

  logout(): void {
    this.usuarioAtual.set(null);
    this.autenticadoEm = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Confere se a sessão ainda vale. Se expirou, encerra e devolve false
   * para o guard mandar a pessoa ao login (e o acesso ser registrado de novo).
   */
  garantirSessao(): boolean {
    return !this.encerrarSeExpirada(false);
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

  private encerrarSeExpirada(redirecionar: boolean): boolean {
    if (!this.usuarioAtual()) return true;
    if (!sessaoExpirada(this.autenticadoEm)) return false;
    this.logout();
    if (redirecionar && !this.router.url.startsWith('/login')) {
      void this.router.navigateByUrl('/login');
    }
    return true;
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SessaoPersistida>;
      if (!parsed?.id || !parsed?.usuario || !parsed?.nome) return null;
      if (parsed.perfil !== 'ADMIN' && parsed.perfil !== 'USUARIO') return null;
      if (sessaoExpirada(parsed.autenticadoEm)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      this.autenticadoEm = parsed.autenticadoEm ?? null;
      return {
        id: parsed.id,
        usuario: parsed.usuario,
        nome: parsed.nome,
        perfil: parsed.perfil,
      };
    } catch {
      return null;
    }
  }

  private persistUser(user: AuthUser, autenticadoEm: string): void {
    const sessao: SessaoPersistida = { ...user, autenticadoEm };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    } catch {
      // ignore
    }
  }
}

/** Expira no fim do dia em Brasília, ou depois de 12 horas. Sessão antiga (sem data) também cai. */
function sessaoExpirada(autenticadoEm: string | null | undefined): boolean {
  if (!autenticadoEm) return true;
  const inicio = Date.parse(autenticadoEm);
  if (Number.isNaN(inicio)) return true;
  if (Date.now() - inicio > DURACAO_MAXIMA_MS) return true;
  return diaEmBrasilia(inicio) !== diaEmBrasilia(Date.now());
}

function diaEmBrasilia(instante: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instante));
}
