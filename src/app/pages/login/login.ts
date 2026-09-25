import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PORTAL, PROJETO } from '../../data/projeto.identidade';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly portal = PORTAL;
  readonly projetoInfo = PROJETO;

  usuario = '';
  senha = '';
  readonly erro = signal(false);
  readonly submetendo = signal(false);

  onSubmit(): void {
    this.erro.set(false);
    this.submetendo.set(true);

    const ok = this.auth.login(this.usuario, this.senha);
    this.submetendo.set(false);

    if (!ok) {
      this.erro.set(true);
      return;
    }

    void this.router.navigateByUrl('/');
  }
}
