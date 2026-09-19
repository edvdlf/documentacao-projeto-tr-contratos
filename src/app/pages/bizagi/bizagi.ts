import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-bizagi',
  imports: [DecimalPipe],
  templateUrl: './bizagi.html',
  styleUrl: './bizagi.scss',
})
export class BizagiComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly projeto = inject(ProjetoService);
  readonly zoom = signal(1);

  private readonly rotaId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null as string | null },
  );

  readonly selecionadoId = signal<string | null>(null);

  readonly fluxoSelecionado = computed(() => {
    const fluxos = this.projeto.fluxos();
    if (!fluxos.length) return null;
    const id = this.selecionadoId();
    return (id && this.projeto.fluxoPorId(id)) || fluxos[0];
  });

  constructor() {
    effect(() => {
      const fluxos = this.projeto.fluxos();
      if (!fluxos.length) return;

      const daRota = this.rotaId();
      const atual = this.selecionadoId();

      if (daRota && this.projeto.fluxoPorId(daRota)) {
        if (atual !== daRota) this.selecionadoId.set(daRota);
        return;
      }

      if (!atual || !this.projeto.fluxoPorId(atual)) {
        this.selecionadoId.set(fluxos[0].id);
      }
    });

    effect(() => {
      this.selecionadoId();
      this.zoom.set(1);
    });
  }

  selecionar(id: string): void {
    if (this.selecionadoId() === id) return;
    this.selecionadoId.set(id);
    void this.router.navigate(['/bizagi', id], { replaceUrl: true });
  }

  zoomIn(): void {
    this.zoom.update((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  }

  zoomReset(): void {
    this.zoom.set(1);
  }
}
