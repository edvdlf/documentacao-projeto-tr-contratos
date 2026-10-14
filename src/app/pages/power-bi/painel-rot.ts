import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { mensagemErro } from '../../services/admin-api.service';
import { PainelRotV1Component } from './painel-rot-v1';
import { PainelRotV2Component } from './painel-rot-v2';
import { PainelRotStore, ResumoEnvio, urlPainel } from './painel-rot.store';

type Versao = 1 | 2;

const VERSAO_KEY = 'vetorit.painel-rot.versao';

/** Painel de retificações: envio da planilha (administradores) e escolha entre as visões 1 e 2. */
@Component({
  selector: 'app-painel-rot',
  imports: [PainelRotV1Component, PainelRotV2Component],
  providers: [PainelRotStore],
  templateUrl: './painel-rot.html',
  styleUrl: './painel-rot.scss',
})
export class PainelRotComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(PainelRotStore);

  readonly projetoId = input.required<string>();
  readonly linkPowerBi = input<string | null>(null);
  readonly podeAtualizar = input(false);

  readonly versao = signal<Versao>(lerVersao());

  readonly mostrarEnvio = signal(false);
  readonly arquivo = signal<File | null>(null);
  readonly enviando = signal(false);
  readonly erroEnvio = signal<string | null>(null);
  readonly avisoEnvio = signal<string | null>(null);

  constructor() {
    effect(() => this.store.projetoId.set(this.projetoId()));
  }

  escolherVersao(versao: Versao): void {
    this.versao.set(versao);
    try {
      localStorage.setItem(VERSAO_KEY, String(versao));
    } catch {
      // ignore
    }
  }

  escolherArquivo(evento: Event): void {
    this.arquivo.set((evento.target as HTMLInputElement).files?.[0] ?? null);
    this.erroEnvio.set(null);
    this.avisoEnvio.set(null);
  }

  enviar(): void {
    const arquivo = this.arquivo();
    if (!arquivo) return;
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    this.enviando.set(true);
    this.erroEnvio.set(null);
    this.avisoEnvio.set(null);
    this.http
      .post<ResumoEnvio>(`${urlPainel(this.projetoId())}/painel-retificacoes/planilha`, dados)
      .subscribe({
        next: (r) => {
          this.enviando.set(false);
          this.arquivo.set(null);
          this.mostrarEnvio.set(false);
          this.avisoEnvio.set(
            `Planilha ${r.origem} carregada: ${r.linhas} linha(s)` +
              (r.ignoradas ? `, ${r.ignoradas} ignorada(s) sem período válido.` : '.'),
          );
          this.store.versaoDados.update((v) => v + 1);
        },
        error: (e) => {
          this.enviando.set(false);
          this.erroEnvio.set(mensagemErro(e));
        },
      });
  }
}

function lerVersao(): Versao {
  try {
    return localStorage.getItem(VERSAO_KEY) === '2' ? 2 : 1;
  } catch {
    return 1;
  }
}
