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

  /** Alterna a faixa de cor sempre que a sprint muda em relação à linha anterior. */
  readonly linhas = computed(() => {
    let faixa = 0;
    let sprintAnterior = '';
    return this.filtrados().map((item) => {
      if (sprintAnterior && item.sprint !== sprintAnterior) {
        faixa = 1 - faixa;
      }
      sprintAnterior = item.sprint;
      return { item, faixa };
    });
  });

  selecionarSprint(sprint: string): void {
    this.sprintFiltro.set(sprint);
  }
}
