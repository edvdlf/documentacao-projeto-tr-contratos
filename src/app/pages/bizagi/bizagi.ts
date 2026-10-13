import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FluxosApiService, InfoPacoteFluxos } from '../../services/fluxos-api.service';
import { mensagemErro } from '../../services/admin-api.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-bizagi',
  imports: [DatePipe],
  templateUrl: './bizagi.html',
  styleUrl: './bizagi.scss',
})
export class BizagiComponent implements OnInit {
  readonly projeto = inject(ProjetoService);
  private readonly fluxosApi = inject(FluxosApiService);

  readonly pacote = signal<InfoPacoteFluxos | null>(null);
  readonly urlVisualizador = signal<string | null>(null);
  readonly erroPacote = signal<string | null>(null);

  ngOnInit(): void {
    void this.projeto.atualizar();
    this.fluxosApi.info().subscribe({
      next: (info) => {
        this.pacote.set(info);
        this.urlVisualizador.set(this.fluxosApi.urlVisualizador(info));
      },
      error: (e) => this.erroPacote.set(mensagemErro(e)),
    });
  }
}
