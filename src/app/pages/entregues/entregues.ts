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

  readonly filtrados = computed(() => {
    const sprint = this.sprintFiltro();
    const itens = this.projeto.entregues();
    if (sprint === 'todas') return itens;
    return itens.filter((i) => i.sprint === sprint);
  });

  selecionarSprint(sprint: string): void {
    this.sprintFiltro.set(sprint);
  }
}
