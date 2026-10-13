import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { mensagemErro } from '../../services/admin-api.service';
import { AcessoHistorico, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-acessos',
  imports: [DatePipe],
  templateUrl: './admin-acessos.html',
  styleUrl: './admin-acessos.scss',
})
export class AdminAcessosComponent {
  private readonly auth = inject(AuthService);

  readonly acessos = signal<AcessoHistorico[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly paginaAtual = signal(0);
  readonly totalPaginas = computed(() => {
    const t = this.total();
    return t === 0 ? 0 : Math.ceil(t / 100);
  });

  constructor() {
    this.carregar();
  }

  carregar(page = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.auth.listarAcessos(page, 100).subscribe({
      next: (pagina) => {
        this.acessos.set(pagina.content);
        this.total.set(pagina.page.totalElements);
        this.paginaAtual.set(pagina.page.number);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      },
    });
  }

  limpar(): void {
    if (!confirm('Limpar todo o histórico de acessos do sistema?')) {
      return;
    }
    this.auth.limparHistorico().subscribe({
      next: () => {
        this.acessos.set([]);
        this.total.set(0);
        this.paginaAtual.set(0);
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }
}
