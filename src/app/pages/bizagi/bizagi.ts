import { Component, inject } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-bizagi',
  templateUrl: './bizagi.html',
  styleUrl: './bizagi.scss',
})
export class BizagiComponent {
  readonly projeto = inject(ProjetoService);
}
