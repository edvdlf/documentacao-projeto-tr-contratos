import { Component, computed, inject, signal } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-entregues',
  templateUrl: './entregues.html',
  styleUrl: './entregues.scss',
})
export class EntreguesComponent {
  readonly projeto = inject(ProjetoService);
  readonly sprintFiltro = signal<string>('todas');

  constructor() {
    void this.projeto.atualizar();
  }

  readonly filtrados = computed(() => {
    const sprint = this.sprintFiltro();
    const itens = this.projeto.entregues();
    if (sprint === 'todas') return itens;
    return itens.filter((i) => i.sprint === sprint);
  });

  readonly totalTodas = computed(() => this.projeto.entregues().length);

  readonly sprintsFiltro = computed(() => {
    const totais = new Map<string, number>();
    for (const item of this.projeto.entregues()) {
      if (!item.sprint) continue;
      totais.set(item.sprint, (totais.get(item.sprint) ?? 0) + 1);
    }
    return [...totais.entries()].map(([sprint, total]) => ({ sprint, total }));
  });

  selecionarSprint(sprint: string): void {
    this.sprintFiltro.set(sprint);
  }
}
