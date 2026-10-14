import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { BarrasGraficoComponent } from '../../shared/barras-grafico/barras-grafico';
import { DadosPainel, MESES, PainelRotStore, STATUS } from './painel-rot.store';

/**
 * Visão 1: no formato do relatório do Power BI, com cartões de indicadores.
 * Seleção como nos segmentadores do Power BI: clique seleciona só o item, Ctrl+clique soma
 * ou remove; nada selecionado = todos.
 */
@Component({
  selector: 'app-painel-rot-v1',
  imports: [BarrasGraficoComponent, DatePipe],
  templateUrl: './painel-rot-v1.html',
  styleUrl: './painel-rot-v1.scss',
})
export class PainelRotV1Component {
  readonly store = inject(PainelRotStore);

  readonly dados = input.required<DadosPainel>();
  readonly linkPowerBi = input<string | null>(null);

  readonly meses = MESES;
  readonly legenda = STATUS;
}
