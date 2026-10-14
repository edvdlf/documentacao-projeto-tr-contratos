import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PORTAL } from '../../data/projeto.identidade';
import { AuthService } from '../../services/auth.service';
import { ProjetoService } from '../../services/projeto.service';

const STORAGE_KEY = 'docs-tr-sidebar-collapsed';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  readonly ano = new Date().getFullYear();
  readonly portal = PORTAL;
  readonly projeto = inject(ProjetoService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly collapsed = signal(this.readStoredCollapsed());

  constructor() {
    effect(() => {
      const recursos = this.projeto.recursos();
      const url = this.router.url;
      if (url.startsWith('/bizagi') && !recursos.bizagi) {
        void this.router.navigateByUrl(recursos.powerBi ? '/power-bi' : '/');
      } else if (url.startsWith('/power-bi') && !recursos.powerBi) {
        void this.router.navigateByUrl('/');
      }
    });
  }

  toggleSidebar(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.persistCollapsed(next);
  }

  selecionarProjeto(evento: Event): void {
    void this.projeto.selecionarProjeto((evento.target as HTMLSelectElement).value);
  }

  logout(): void {
    this.auth.logout();
    this.projeto.limpar();
    void this.router.navigateByUrl('/login');
  }

  private readStoredCollapsed(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private persistCollapsed(value: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // ignore
    }
  }
}
