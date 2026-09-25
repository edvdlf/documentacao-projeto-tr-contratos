import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PORTAL, PROJETO } from '../../data/projeto.identidade';
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
  readonly projetoInfo = PROJETO;
  readonly projeto = inject(ProjetoService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly collapsed = signal(this.readStoredCollapsed());

  toggleSidebar(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    this.persistCollapsed(next);
  }

  logout(): void {
    this.auth.logout();
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
