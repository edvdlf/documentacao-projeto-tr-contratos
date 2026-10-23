import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PORTAL } from '../../data/projeto.identidade';
import { ProjetoService } from '../../services/projeto.service';
import { Barra, BarrasGraficoComponent } from '../../shared/barras-grafico/barras-grafico';
import { BurndownGraficoComponent } from '../../shared/burndown-grafico/burndown-grafico';

const COR_HOMOLOGADAS = '#387c2b';
const COR_DESENVOLVIDAS = '#0062c4';
const COR_A_DESENVOLVER = '#c8c8c8';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, BarrasGraficoComponent, BurndownGraficoComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  readonly portal = PORTAL;
  readonly projeto = inject(ProjetoService);

  constructor() {
    void this.projeto.atualizar();
  }

  readonly tarefas = computed(() => this.projeto.resumoTarefas());

  readonly barrasResumo = computed<Barra[]>(() => {
    const t = this.tarefas();
    return [
      { rotulo: 'Homologadas', valor: t.homologadas, cor: COR_HOMOLOGADAS },
      { rotulo: 'Desenvolvidas', valor: t.desenvolvidas, cor: COR_DESENVOLVIDAS },
      { rotulo: 'A desenvolver', valor: t.aDesenvolver, cor: COR_A_DESENVOLVER },
    ];
  });

  percentualSprint(planejadas: number, entregues: number | null): number {
    if (!planejadas) return 0;
    return Math.min(100, ((entregues ?? 0) / planejadas) * 100);
  }
}
