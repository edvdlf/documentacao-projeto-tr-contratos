import { Component, inject } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-riscos',
  templateUrl: './riscos.html',
  styleUrl: './riscos.scss',
})
export class RiscosComponent {
  readonly projeto = inject(ProjetoService);
}
