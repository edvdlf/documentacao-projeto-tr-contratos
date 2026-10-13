import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-resumo-sprints',
  imports: [RouterLink],
  templateUrl: './resumo-sprints.html',
  styleUrl: './resumo-sprints.scss',
})
export class ResumoSprintsComponent {
  readonly projeto = inject(ProjetoService);
  readonly auth = inject(AuthService);

  constructor() {
    void this.projeto.atualizar();
  }
}
