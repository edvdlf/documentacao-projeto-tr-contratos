import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Projeto } from '../../models/admin.models';
import { AdminApiService, mensagemErro } from '../../services/admin-api.service';

const CHAVE_ULTIMO_PROJETO = 'vetorit.admin.projeto';

/**
 * Seleção do projeto das telas de atividades, sprints e fluxos. O projeto fica na query string
 * (`?projeto=<id>`); sem ela, usa o último escolhido ou o primeiro da lista.
 */
@Component({
  selector: 'app-seletor-projeto',
  imports: [FormsModule],
  template: `
    <label class="adm-field">
      Projeto
      <select
        name="seletorProjeto"
        [ngModel]="projetoId() ?? ''"
        (ngModelChange)="selecionar($event)"
        [disabled]="!projetos().length"
      >
        @if (!projetos().length) {
          <option value="">{{ carregado() ? 'Nenhum projeto cadastrado' : 'Carregando…' }}</option>
        }
        @for (p of projetos(); track p.id) {
          <option [value]="p.id">{{ p.codigo }} — {{ p.nome }}</option>
        }
      </select>
      @if (erro(); as msg) {
        <span class="adm-field__erro">{{ msg }}</span>
      }
    </label>
  `,
})
export class SeletorProjetoComponent {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  /** Id vindo da query string `projeto`. */
  readonly projetoId = input<string | undefined>();
  /** Emitido sempre que o projeto efetivo muda (null se o id não existe). */
  readonly projetoAlterado = output<Projeto | null>();

  readonly projetos = signal<Projeto[]>([]);
  readonly carregado = signal(false);
  readonly erro = signal<string | null>(null);
  private ultimoEmitido: string | null | undefined;

  constructor() {
    this.api.listarProjetos('', { page: 0, size: 200, sort: 'nome', direction: 'ASC' }).subscribe({
      next: (p) => {
        this.projetos.set(p.content);
        this.carregado.set(true);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregado.set(true);
      },
    });

    effect(() => {
      if (!this.carregado()) return;
      const lista = this.projetos();
      const id = this.projetoId();
      if (!id) {
        const ultimo = localStorage.getItem(CHAVE_ULTIMO_PROJETO);
        const padrao = lista.find((p) => p.id === ultimo) ?? lista[0];
        if (padrao) {
          this.selecionar(padrao.id, true);
        } else {
          this.emitir(null);
        }
        return;
      }
      const projeto = lista.find((p) => p.id === id) ?? null;
      if (projeto) localStorage.setItem(CHAVE_ULTIMO_PROJETO, projeto.id);
      this.emitir(projeto);
    });
  }

  selecionar(id: string, substituirHistorico = false): void {
    this.router.navigate([], {
      queryParams: { projeto: id || null },
      queryParamsHandling: 'merge',
      replaceUrl: substituirHistorico,
    });
  }

  private emitir(projeto: Projeto | null): void {
    const id = projeto?.id ?? null;
    if (id === this.ultimoEmitido) return;
    this.ultimoEmitido = id;
    this.projetoAlterado.emit(projeto);
  }
}
