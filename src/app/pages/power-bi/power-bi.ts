import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { ProjetoService } from '../../services/projeto.service';
import { PainelRotComponent } from './painel-rot';

@Component({
  selector: 'app-power-bi',
  imports: [PainelRotComponent],
  templateUrl: './power-bi.html',
  styleUrl: './power-bi.scss',
})
export class PowerBiComponent {
  readonly projeto = inject(ProjetoService);
  readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly relatorio = computed(() => {
    const powerBi = this.projeto.recursos().powerBi;
    return powerBi
      ? {
          ...powerBi,
          urlSegura: this.sanitizer.bypassSecurityTrustResourceUrl(powerBi.url),
        }
      : null;
  });

  constructor() {
    void this.projeto.atualizar();
  }
}
