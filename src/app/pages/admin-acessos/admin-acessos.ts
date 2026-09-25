import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-acessos',
  imports: [DatePipe],
  templateUrl: './admin-acessos.html',
  styleUrl: './admin-acessos.scss',
})
export class AdminAcessosComponent {
  private readonly auth = inject(AuthService);

  readonly acessos = this.auth.acessos;
  readonly total = computed(() => this.acessos().length);

  limpar(): void {
    if (!confirm('Limpar todo o histórico de acessos neste navegador?')) {
      return;
    }
    this.auth.limparHistorico();
  }
}
