import { Component, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ResultadoImportacao } from '../../models/admin.models';
import { mensagemErro } from '../../services/admin-api.service';

/** Painel de envio de planilha usado nas listagens administrativas. */
@Component({
  selector: 'app-importar-planilha',
  template: `
    <section class="adm-panel">
      <h3>{{ titulo() }}</h3>
      <p class="adm-dica"><ng-content /></p>
      <div class="adm-filters">
        <ng-content select="[acoes]" />
        <label class="adm-field">
          Planilha (.xlsx)
          <input type="file" accept=".xlsx,.xls" (change)="selecionar($event)" />
        </label>
        <button
          type="button"
          class="adm-btn adm-btn--primary"
          [disabled]="!arquivo() || enviando() || desabilitado()"
          (click)="enviar()"
        >
          {{ enviando() ? 'Importando…' : 'Importar' }}
        </button>
        <button type="button" class="adm-btn" (click)="fechar.emit()">Fechar</button>
      </div>
      @if (erro(); as msg) {
        <div class="adm-alert adm-alert--erro" role="alert">{{ msg }}</div>
      }
      @if (resultado(); as r) {
        <div class="adm-alert adm-alert--ok" role="status">
          Importação concluída: {{ r.criadas }} {{ rotulo() }} criado(s), {{ r.atualizadas }}
          atualizado(s), {{ r.ignoradas }} linha(s) ignorada(s).
        </div>
        @if (r.avisos.length) {
          <details open>
            <summary>Avisos ({{ r.avisos.length }})</summary>
            <ul>
              @for (a of r.avisos; track $index) {
                <li>{{ a }}</li>
              }
            </ul>
          </details>
        }
      }
    </section>
  `,
})
export class ImportarPlanilhaComponent {
  readonly titulo = input('Importar planilha');
  /** Ex.: "sprint(s)", usado na mensagem de resultado. */
  readonly rotulo = input('registro(s)');
  readonly desabilitado = input(false);
  readonly importar = input.required<(arquivo: File) => Observable<ResultadoImportacao>>();

  readonly importado = output<ResultadoImportacao>();
  readonly fechar = output<void>();

  readonly arquivo = signal<File | null>(null);
  readonly enviando = signal(false);
  readonly resultado = signal<ResultadoImportacao | null>(null);
  readonly erro = signal<string | null>(null);

  selecionar(evento: Event): void {
    this.arquivo.set((evento.target as HTMLInputElement).files?.[0] ?? null);
    this.resultado.set(null);
    this.erro.set(null);
  }

  enviar(): void {
    const arquivo = this.arquivo();
    if (!arquivo) return;
    this.enviando.set(true);
    this.resultado.set(null);
    this.erro.set(null);
    this.importar()(arquivo).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.resultado.set(r);
        this.importado.emit(r);
      },
      error: (e) => {
        this.enviando.set(false);
        this.erro.set(mensagemErro(e));
      },
    });
  }
}
