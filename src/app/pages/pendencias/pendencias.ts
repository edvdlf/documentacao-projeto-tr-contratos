import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-pendencias',
  imports: [RouterLink],
  templateUrl: './pendencias.html',
  styleUrl: './pendencias.scss',
})
export class PendenciasComponent {
  readonly projeto = inject(ProjetoService);

  constructor() {
    void this.projeto.atualizar();
  }
}
