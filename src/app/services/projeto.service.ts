import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CONTEUDO_FALLBACK } from '../data/projeto.data';
import {
  EvolucaoSprint,
  FluxoBizagi,
  ItemEntrega,
  Pendencia,
  ProjetoConteudo,
  ResumoSprint,
  Risco,
} from '../models/projeto.models';
import { parseProjetoWorkbook } from './excel-parser';

/** Planilha servida a partir de conteudo/ (via angular.json assets). */
const EXCEL_URL = 'data/Sprint_Review_Controle_Entregas.xlsx';

@Injectable({ providedIn: 'root' })
export class ProjetoService {
  private readonly http = inject(HttpClient);

  readonly carregado = signal(false);
  readonly fonte = signal<string | undefined>(undefined);
  readonly geradoEm = signal<string | undefined>(undefined);
  readonly resumo = signal<ResumoSprint>(CONTEUDO_FALLBACK.resumo);
  readonly entregues = signal<ItemEntrega[]>([]);
  readonly proximaSprint = signal<ItemEntrega[]>([]);
  readonly pendencias = signal<Pendencia[]>([]);
  readonly evolucao = signal<EvolucaoSprint[]>([]);
  readonly riscos = signal<Risco[]>([]);
  readonly fluxos = signal<FluxoBizagi[]>([]);

  readonly sprintsEntregues = computed(() => {
    const set = new Set(this.entregues().map((i) => i.sprint).filter(Boolean));
    return [...set];
  });

  readonly progressoGeral = computed(() => {
    const t = this.resumoTarefas();
    if (!t.planejadoTotal) return 0;
    return Math.round((t.desenvolvidas / t.planejadoTotal) * 100);
  });

  /** Totais da aba Evolução do Projeto: desenvolvidas × a desenvolver */
  readonly resumoTarefas = computed(() => {
    const evo = this.evolucao();
    const planejadoTotal = evo.reduce((acc, s) => acc + (s.planejadas || 0), 0);
    const desenvolvidas = evo.reduce((acc, s) => acc + (s.entregues ?? 0), 0);
    const aDesenvolver = Math.max(0, planejadoTotal - desenvolvidas);
    const percentualDesenvolvidas = planejadoTotal
      ? Math.round((desenvolvidas / planejadoTotal) * 100)
      : 0;
    return {
      planejadoTotal,
      desenvolvidas,
      aDesenvolver,
      percentualDesenvolvidas,
    };
  });

  async carregar(): Promise<void> {
    try {
      // cache-bust: evita Excel antigo no navegador
      const url = `${EXCEL_URL}?v=${Date.now()}`;
      const buffer = await firstValueFrom(
        this.http.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }),
      );
      const data = parseProjetoWorkbook(buffer);
      this.aplicar(data);
      console.info(
        '[projeto] planilha carregada · fluxos:',
        data.fluxos.map((f) => `${f.seq}:${f.id}`).join(' → '),
      );
    } catch (err) {
      console.error('Falha ao carregar planilha; usando fallback vazio.', err);
      this.aplicar(CONTEUDO_FALLBACK);
    } finally {
      this.carregado.set(true);
    }
  }

  fluxoPorId(id: string): FluxoBizagi | undefined {
    return this.fluxos().find((f) => f.id === id);
  }

  private aplicar(data: ProjetoConteudo): void {
    this.fonte.set(data.fonte);
    this.geradoEm.set(data.geradoEm);
    this.resumo.set(data.resumo ?? CONTEUDO_FALLBACK.resumo);
    this.entregues.set(data.entregues ?? []);
    this.proximaSprint.set(data.proximaSprint ?? []);
    this.pendencias.set(data.pendencias ?? []);
    this.evolucao.set(data.evolucao ?? []);
    this.riscos.set(data.riscos ?? []);
    const fluxos = [...(data.fluxos ?? [])].sort(
      (a, b) => a.seq - b.seq || a.nome.localeCompare(b.nome, 'pt-BR'),
    );
    this.fluxos.set(fluxos);
  }
}
