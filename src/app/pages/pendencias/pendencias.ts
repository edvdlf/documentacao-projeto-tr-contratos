import { Component, inject } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-pendencias',
  templateUrl: './pendencias.html',
  styleUrl: './pendencias.scss',
})
export class PendenciasComponent {
  readonly projeto = inject(ProjetoService);
}
