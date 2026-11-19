import { Component, computed, effect, inject, signal } from '@angular/core';
import { dataBr, HistoricoAtividade, Listagem, Pagina } from '../../models/admin.models';
import { AdminApiService, mensagemErro } from '../../services/admin-api.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-historicos',
  templateUrl: './historicos.html',
  styleUrl: './historicos.scss',
})
export class HistoricosComponent {
  private readonly api = inject(AdminApiService);
  readonly projeto = inject(ProjetoService);

  readonly dataBr = dataBr;
  readonly historicos = signal<HistoricoAtividade[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly paginaAtual = signal(0);
  readonly tamanhoPagina = 50;
  readonly totalPaginas = computed(() => {
    const t = this.total();
    return t === 0 ? 0 : Math.ceil(t / this.tamanhoPagina);
  });

  constructor() {
    void this.projeto.atualizar();
    effect(() => {
      const id = this.projeto.projetoAtual()?.id;
      if (id) {
        this.carregar(0);
      } else {
        this.historicos.set([]);
        this.total.set(0);
        this.paginaAtual.set(0);
      }
    });
  }

  carregar(page = this.paginaAtual()): void {
    const projetoId = this.projeto.projetoAtual()?.id;
    if (!projetoId) return;

    const listagem: Listagem = {
      page,
      size: this.tamanhoPagina,
      sort: 'data',
      direction: 'DESC',
    };

    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarHistoricosProjeto(projetoId, listagem).subscribe({
      next: (pagina: Pagina<HistoricoAtividade>) => {
        this.historicos.set(pagina.content);
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
}
