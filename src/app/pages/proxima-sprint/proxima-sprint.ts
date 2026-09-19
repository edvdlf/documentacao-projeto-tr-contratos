import { Component, inject } from '@angular/core';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-proxima-sprint',
  templateUrl: './proxima-sprint.html',
  styleUrl: './proxima-sprint.scss',
})
export class ProximaSprintComponent {
  readonly projeto = inject(ProjetoService);
}
