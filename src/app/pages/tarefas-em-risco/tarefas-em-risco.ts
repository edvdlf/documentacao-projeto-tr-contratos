import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-tarefas-em-risco',
  imports: [RouterLink],
  templateUrl: './tarefas-em-risco.html',
  styleUrl: './tarefas-em-risco.scss',
})
export class TarefasEmRiscoComponent {
  readonly projeto = inject(ProjetoService);

  constructor() {
    void this.projeto.atualizar();
  }

  readonly ativos = computed(() => this.projeto.impactosAtivos());
  readonly resolvidos = computed(() => this.projeto.impactos().filter((i) => !i.ativo));
}
