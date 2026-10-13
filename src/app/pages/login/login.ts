import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PORTAL } from '../../data/projeto.identidade';
import { AuthService } from '../../services/auth.service';
import { ProjetoService } from '../../services/projeto.service';

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
  readonly projeto = inject(ProjetoService);

  usuario = '';
  senha = '';
  readonly erro = signal(false);
  readonly submetendo = signal(false);
  readonly senhaVisivel = signal(false);

  alternarSenha(): void {
    this.senhaVisivel.update((v) => !v);
  }

  onSubmit(): void {
    this.erro.set(false);
    this.submetendo.set(true);

    this.auth.login(this.usuario, this.senha).subscribe({
      next: (user) => {
        this.submetendo.set(false);
        if (!user) {
          this.erro.set(true);
          return;
        }
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.submetendo.set(false);
        this.erro.set(true);
      },
    });
  }
}
