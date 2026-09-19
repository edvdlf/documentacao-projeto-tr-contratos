import { Component, inject } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-evolucao',
  templateUrl: './evolucao.html',
  styleUrl: './evolucao.scss',
})
export class EvolucaoComponent {
  readonly projeto = inject(ProjetoService);

  percentual(planejadas: number, entregues: number | null): number {
    if (!planejadas) return 0;
    return Math.min(100, ((entregues ?? 0) / planejadas) * 100);
  }
}
