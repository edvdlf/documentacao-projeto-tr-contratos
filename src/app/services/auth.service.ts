import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser {
  usuario: string;
  nome: string;
}

export interface AcessoHistorico {
  id: string;
  usuario: string;
  nome: string;
  /** ISO 8601 — data e hora do login */
  ocorridoEm: string;
}

interface FixedCredential extends AuthUser {
  senha: string;
}

const STORAGE_KEY = 'docs-tr-auth-user';
const HISTORY_KEY = 'docs-tr-login-history';
const HISTORY_LIMIT = 500;

/** Logins com acesso à área admin (histórico de acessos). */
const ADMIN_USUARIOS = [
  'michel.paiva@vetorit.com.br',
  'edvaldo.silva@vetorit.com.br',
  'henrique.pontes@vetorit.com.br',
  'aline.melo@vetorit.com.br',
];

/** Usuários e senhas fixos — acesso restrito simples (não é autenticação de produção). */
const USUARIOS_FIXOS: FixedCredential[] = [
  { usuario: 'admin', senha: 'Admin@2026', nome: 'Administrador' },
  { usuario: 'gestao', senha: 'Gestao@2026', nome: 'Gestão do Projeto' },
  { usuario: 'analista', senha: 'Analista@2026', nome: 'Analista VetorIT' },
  { usuario: 'cliente', senha: 'Cliente@2026', nome: 'Cliente TR' },
  { usuario: 'viewer', senha: 'Viewer@2026', nome: 'Visualização' },
  {
    usuario: 'carlos.zeglio@thomsonreuters.com',
    senha: 'Carlos@2026',
    nome: 'Carlos Zeglio',
  },
  {
    usuario: 'sheila.morais@thomsonreuters.com',
    senha: 'Sheila@2026',
    nome: 'Sheila Morais',
  },
  {
    usuario: 'jaqueline.c.rodrigues@thomsonreuters.com',
    senha: 'Jaqueline@2026',
    nome: 'Jaqueline Rodrigues',
  },
  {
    usuario: 'michel.paiva@vetorit.com.br',
    senha: 'Michel@2026',
    nome: 'Michel Paiva',
  },
  {
    usuario: 'edvaldo.silva@vetorit.com.br',
    senha: 'Edvaldo@2026',
    nome: 'Edvaldo Silva',
  },
  {
    usuario: 'henrique.pontes@vetorit.com.br',
    senha: 'Henrique@2026',
    nome: 'Henrique Pontes',
  },
  {
    usuario: 'aline.melo@vetorit.com.br',
    senha: 'Aline@2026',
    nome: 'Aline Melo',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioAtual = signal<AuthUser | null>(this.readStoredUser());
  private readonly historicoAcessos = signal<AcessoHistorico[]>(this.readHistory());

  readonly user = this.usuarioAtual.asReadonly();
  readonly isAuthenticated = computed(() => this.usuarioAtual() !== null);
  readonly isAdmin = computed(() => {
    const u = this.usuarioAtual()?.usuario;
    return !!u && ADMIN_USUARIOS.includes(u);
  });
  readonly acessos = this.historicoAcessos.asReadonly();

  login(usuario: string, senha: string): boolean {
    const match = USUARIOS_FIXOS.find(
      (u) =>
        u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.senha === senha,
    );

    if (!match) {
      return false;
    }

    const session: AuthUser = { usuario: match.usuario, nome: match.nome };
    this.usuarioAtual.set(session);
    this.persistUser(session);
    this.registrarAcesso(session);
    return true;
  }

  logout(): void {
    this.usuarioAtual.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  limparHistorico(): void {
    this.historicoAcessos.set([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }

  private registrarAcesso(user: AuthUser): void {
    const entrada: AcessoHistorico = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      usuario: user.usuario,
      nome: user.nome,
      ocorridoEm: new Date().toISOString(),
    };

    const atualizado = [entrada, ...this.historicoAcessos()].slice(0, HISTORY_LIMIT);
    this.historicoAcessos.set(atualizado);
    this.persistHistory(atualizado);
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthUser;
      if (!parsed?.usuario || !parsed?.nome) return null;
      const stillValid = USUARIOS_FIXOS.some((u) => u.usuario === parsed.usuario);
      return stillValid ? parsed : null;
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

  private readHistory(): AcessoHistorico[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AcessoHistorico[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (a) => a?.usuario && a?.nome && typeof a.ocorridoEm === 'string',
      );
    } catch {
      return [];
    }
  }

  private persistHistory(items: AcessoHistorico[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}
