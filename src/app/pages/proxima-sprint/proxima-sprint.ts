import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-proxima-sprint',
  imports: [RouterLink],
  templateUrl: './proxima-sprint.html',
  styleUrl: './proxima-sprint.scss',
})
export class ProximaSprintComponent {
  readonly projeto = inject(ProjetoService);
  readonly auth = inject(AuthService);

  constructor() {
    void this.projeto.atualizar();
  }
}
