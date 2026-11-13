import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FluxosApiService, InfoPacoteFluxos } from '../../services/fluxos-api.service';
import { mensagemErro } from '../../services/admin-api.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-bizagi',
  imports: [DatePipe],
  templateUrl: './bizagi.html',
  styleUrl: './bizagi.scss',
})
export class BizagiComponent {
  readonly projeto = inject(ProjetoService);
  private readonly fluxosApi = inject(FluxosApiService);

  readonly pacote = signal<InfoPacoteFluxos | null>(null);
  readonly urlVisualizador = signal<string | null>(null);
  readonly erroPacote = signal<string | null>(null);

  constructor() {
    void this.projeto.atualizar();
    effect(() => {
      const projetoId = this.projeto.projetoAtual()?.id;
      this.pacote.set(null);
      this.urlVisualizador.set(null);
      this.erroPacote.set(null);
      if (!projetoId) return;
      this.fluxosApi.info(projetoId).subscribe({
        next: (info) => {
          // Ignora resposta se o projeto mudou enquanto a chamada estava em andamento.
          if (this.projeto.projetoAtual()?.id !== projetoId) return;
          this.pacote.set(info);
          this.urlVisualizador.set(this.fluxosApi.urlVisualizador(info));
        },
        error: (e) => {
          if (this.projeto.projetoAtual()?.id !== projetoId) return;
          this.erroPacote.set(mensagemErro(e));
        },
      });
    });
  }
}
