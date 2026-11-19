import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Projeto } from '../../models/admin.models';
import { ProjetoService } from '../../services/projeto.service';

/**
 * Seleção de projeto nas telas de administração.
 * Usa o mesmo projeto em acompanhamento do portal (`ProjetoService` / combobox do shell).
 * Mantém `?projeto=<id>` na URL para deep links e troca entre telas admin.
 */
@Component({
  selector: 'app-seletor-projeto',
  imports: [FormsModule],
  template: `
    <label class="adm-field">
      Projeto
      <select
        name="seletorProjeto"
        [ngModel]="idExibido()"
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
    </label>
  `,
})
export class SeletorProjetoComponent {
  private readonly portal = inject(ProjetoService);
  private readonly router = inject(Router);

  /** Id vindo da query string `projeto` (withComponentInputBinding). */
  readonly projetoId = input<string | undefined>();
  /** Emitido sempre que o projeto efetivo muda (null se não houver). */
  readonly projetoAlterado = output<Projeto | null>();

  readonly projetos = this.portal.projetos;
  readonly carregado = this.portal.carregado;
  /** Prefere a query (troca imediata no select) e cai no projeto do portal. */
  readonly idExibido = computed(
    () => this.projetoId() || this.portal.projetoAtual()?.id || '',
  );

  private ultimoEmitido: string | null | undefined;

  constructor() {
    effect(() => {
      if (!this.portal.carregado()) return;

      const lista = this.portal.projetos();
      const queryId = this.projetoId();
      const atual = this.portal.projetoAtual();
      const atualId = atual?.id ?? null;

      if (queryId && lista.some((p) => p.id === queryId)) {
        if (queryId !== atualId) {
          // Deep link ou select admin à frente do painel do portal.
          void this.portal.selecionarProjeto(queryId);
          return;
        }
        this.emitir(atual);
        return;
      }

      if (atualId) {
        // Portal (shell) é a fonte da verdade: alinha a query e avisa a tela admin.
        if (queryId !== atualId) {
          this.atualizarQuery(atualId, true, true);
        }
        this.emitir(atual);
        return;
      }

      this.emitir(null);
    });
  }

  selecionar(id: string): void {
    if (!id) return;
    this.atualizarQuery(id, false, true);
    void this.portal.selecionarProjeto(id);
  }

  private atualizarQuery(id: string, substituirHistorico: boolean, limparSprint: boolean): void {
    this.router.navigate([], {
      queryParams: limparSprint ? { projeto: id || null, sprint: null } : { projeto: id || null },
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
