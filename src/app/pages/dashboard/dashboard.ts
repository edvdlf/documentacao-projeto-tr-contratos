import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  readonly projeto = inject(ProjetoService);

  readonly tarefas = computed(() => this.projeto.resumoTarefas());

  readonly circunferencia = 2 * Math.PI * 42;

  readonly dashDesenvolvidas = computed(() => {
    const t = this.tarefas();
    if (!t.planejadoTotal) return `0 ${this.circunferencia}`;
    const len = (t.desenvolvidas / t.planejadoTotal) * this.circunferencia;
    return `${len} ${this.circunferencia}`;
  });
}
