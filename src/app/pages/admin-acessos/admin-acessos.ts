import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { mensagemErro } from '../../services/admin-api.service';
import { AcessoHistorico, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-acessos',
  imports: [DatePipe],
  templateUrl: './admin-acessos.html',
  styleUrl: './admin-acessos.scss',
})
export class AdminAcessosComponent {
  private readonly auth = inject(AuthService);

  readonly acessos = signal<AcessoHistorico[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly paginaAtual = signal(0);
  readonly totalPaginas = computed(() => {
    const t = this.total();
    return t === 0 ? 0 : Math.ceil(t / 100);
  });

  constructor() {
    this.carregar();
  }

  carregar(page = 0): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.auth.listarAcessos(page, 100).subscribe({
      next: (pagina) => {
        this.acessos.set(ordenarMaisRecentes(pagina.content));
        this.total.set(pagina.page.totalElements);
        this.paginaAtual.set(pagina.page.number);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      },
    });
  }

  limpar(): void {
    if (!confirm('Limpar todo o histórico de acessos do sistema?')) {
      return;
    }
    this.auth.limparHistorico().subscribe({
      next: () => {
        this.acessos.set([]);
        this.total.set(0);
        this.paginaAtual.set(0);
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  relativo(iso: string): string {
    const ocorrido = new Date(iso).getTime();
    if (Number.isNaN(ocorrido)) return '';
    const minutos = Math.max(0, Math.floor((Date.now() - ocorrido) / 60_000));
    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ontem';
    if (dias < 7) return `há ${dias} dias`;
    return '';
  }
}

function ordenarMaisRecentes(acessos: AcessoHistorico[]): AcessoHistorico[] {
  return [...acessos].sort((a, b) => {
    const porData = Date.parse(b.ocorridoEm) - Date.parse(a.ocorridoEm);
    return porData !== 0 ? porData : b.id.localeCompare(a.id);
  });
}
