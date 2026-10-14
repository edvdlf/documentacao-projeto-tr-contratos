import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemErro } from '../../services/admin-api.service';
import { Barra } from '../../shared/barras-grafico/barras-grafico';

/** `GET /api/projetos/{id}/painel-retificacoes`, gerado a partir da última planilha enviada. */
export interface DadosPainel {
  titulo: string;
  origem: string;
  geradoEm: string;
  linhas: number;
  etapas: { chave: string; titulo: string; acoes: string[] }[];
  cidades: string[];
  /** [periodo yyyy-MM, índice da cidade, índice da ação de cada etapa..., quantidade] */
  registros: (string | number)[][];
}

export interface ResumoEnvio {
  origem: string;
  linhas: number;
  ignoradas: number;
}

export type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'vazio' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'ok'; dados: DadosPainel };

export type StatusAcao = 'finalizado' | 'andamento' | 'impedimento' | 'nao_iniciado';

/** Situação geral da retificação na API (`situacao`). */
export const SITUACAO_API: Record<StatusAcao, string> = {
  finalizado: 'FINALIZADA',
  andamento: 'EM_ANDAMENTO',
  impedimento: 'IMPEDIMENTO',
  nao_iniciado: 'NAO_INICIADA',
};

export const COR_STATUS: Record<StatusAcao, string> = {
  finalizado: '#2e7d32',
  andamento: '#1a73e8',
  impedimento: '#d93025',
  nao_iniciado: '#9aa0a6',
};

/** Ordem dos cartões de indicadores e da legenda. */
export const STATUS: { chave: StatusAcao; rotulo: string; dica: string; cor: string }[] = [
  {
    chave: 'finalizado',
    rotulo: 'Finalizadas',
    dica: 'Entrega SPED Fiscal finalizada',
    cor: COR_STATUS.finalizado,
  },
  {
    chave: 'andamento',
    rotulo: 'Em andamento',
    dica: 'Alguma etapa iniciada, sem impedimento e ainda não entregue',
    cor: COR_STATUS.andamento,
  },
  {
    chave: 'impedimento',
    rotulo: 'Com impedimento',
    dica: 'Alguma etapa em Impedimento (e ainda não entregue)',
    cor: COR_STATUS.impedimento,
  },
  {
    chave: 'nao_iniciado',
    rotulo: 'Não iniciadas',
    dica: 'Todas as etapas em Não Iniciado',
    cor: COR_STATUS.nao_iniciado,
  },
];

export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Classifica a ação pelo texto ("5. Impedimento", "6. Finalizado", "4. Sem Ajustes", "0. Não Iniciado"...). */
export function statusDaAcao(acao: string): StatusAcao {
  const texto = acao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (texto.includes('impedimento')) return 'impedimento';
  if (texto.includes('finalizado') || texto.includes('sem ajustes')) return 'finalizado';
  if (texto.includes('nao iniciado') || /^0\b/.test(texto)) return 'nao_iniciado';
  return 'andamento';
}

export function urlPainel(projetoId: string): string {
  return `${environment.apiUrl}/api/projetos/${projetoId}`;
}

/**
 * Dados e filtros do painel de retificações, compartilhados pelas visões 1 e 2
 * (trocar de visão mantém a seleção). Filtros vazios = todos.
 */
@Injectable()
export class PainelRotStore {
  private readonly http = inject(HttpClient);

  readonly projetoId = signal<string | null>(null);
  /** Incrementado após cada envio de planilha para recarregar o painel. */
  readonly versaoDados = signal(0);
  /** Os filtros só voltam ao padrão ao trocar de projeto; após um envio, a seleção é mantida. */
  private filtrosDoProjeto: string | null = null;

  readonly estado = toSignal(
    toObservable(computed(() => ({ projetoId: this.projetoId(), versao: this.versaoDados() }))).pipe(
      map(({ projetoId }) => projetoId),
      filter((projetoId): projetoId is string => projetoId !== null),
      switchMap((projetoId) =>
        this.http.get<DadosPainel>(`${urlPainel(projetoId)}/painel-retificacoes`).pipe(
          map((dados): Estado => {
            if (this.filtrosDoProjeto !== projetoId) {
              this.filtrosDoProjeto = projetoId;
              this.selecionarPadrao(dados);
            }
            return { tipo: 'ok', dados };
          }),
          catchError((e) =>
            of<Estado>(
              e instanceof HttpErrorResponse && e.status === 404
                ? { tipo: 'vazio' }
                : { tipo: 'erro', mensagem: mensagemErro(e) },
            ),
          ),
          startWith<Estado>({ tipo: 'carregando' }),
        ),
      ),
      catchError(() => EMPTY),
    ),
    { initialValue: { tipo: 'carregando' } as Estado },
  );

  readonly dados = computed(() => {
    const e = this.estado();
    return e.tipo === 'ok' ? e.dados : null;
  });

  readonly anos = computed(() => {
    const anos = new Set(
      (this.dados()?.registros ?? []).map((r) => Number(String(r[0]).slice(0, 4))),
    );
    return [...anos].sort();
  });

  readonly cidades = computed(() => this.dados()?.cidades ?? []);

  readonly anosSel = signal<Set<number>>(new Set());
  readonly mesesSel = signal<Set<number>>(new Set());
  /** Índices em `cidades()`. */
  readonly cidadesSel = signal<Set<number>>(new Set());

  readonly nomesCidadesSel = computed(() => {
    const cidades = this.cidades();
    return [...this.cidadesSel()].map((i) => cidades[i]).filter(Boolean);
  });

  /** Ex.: "outubro de 2026", "outubro · todos os anos", "todos os períodos". */
  readonly descricaoPeriodo = computed(() => {
    const anos = [...this.anosSel()].sort();
    const meses = [...this.mesesSel()].sort((a, b) => a - b).map((m) => MESES[m - 1]);
    if (!anos.length && !meses.length) return 'todos os períodos';
    const textoAnos = anos.length ? anos.join(', ') : 'todos os anos';
    if (!meses.length) return textoAnos;
    return anos.length ? `${meses.join(', ')} de ${textoAnos}` : `${meses.join(', ')} · ${textoAnos}`;
  });

  readonly filtrados = computed(() => {
    const anos = this.anosSel();
    const meses = this.mesesSel();
    const cidades = this.cidadesSel();
    return (this.dados()?.registros ?? []).filter((r) => {
      const [ano, mes] = String(r[0]).split('-').map(Number);
      return (
        (!anos.size || anos.has(ano)) &&
        (!meses.size || meses.has(mes)) &&
        (!cidades.size || cidades.has(Number(r[1])))
      );
    });
  });

  readonly total = computed(() =>
    this.filtrados().reduce((soma, r) => soma + Number(r[r.length - 1]), 0),
  );

  /** Status de cada ação, por etapa (mesmos índices de `etapas[i].acoes`). */
  private readonly statusDasAcoes = computed(() =>
    (this.dados()?.etapas ?? []).map((e) => e.acoes.map(statusDaAcao)),
  );

  readonly indicadores = computed(() => {
    const status = this.statusDasAcoes();
    const ultima = status.length - 1;
    const soma: Record<StatusAcao, number> = {
      finalizado: 0,
      andamento: 0,
      impedimento: 0,
      nao_iniciado: 0,
    };
    for (const r of this.filtrados()) {
      const etapas = status.map((acoes, i) => acoes[Number(r[2 + i])]);
      const geral: StatusAcao =
        etapas[ultima] === 'finalizado'
          ? 'finalizado'
          : etapas.includes('impedimento')
            ? 'impedimento'
            : etapas.every((s) => s === 'nao_iniciado')
              ? 'nao_iniciado'
              : 'andamento';
      soma[geral] += Number(r[r.length - 1]);
    }
    const total = this.total();
    return STATUS.map((s) => ({
      ...s,
      valor: soma[s.chave],
      percentual: total ? Math.round((soma[s.chave] / total) * 100) : 0,
    }));
  });

  /** Por etapa: quantidade por ação (com o status de cada ação), na ordem das ações. */
  readonly porEtapa = computed(() => {
    const dados = this.dados();
    if (!dados) return [];
    const status = this.statusDasAcoes();
    const registros = this.filtrados();
    return dados.etapas.map((etapa, i) => {
      const porAcao = new Array<number>(etapa.acoes.length).fill(0);
      for (const r of registros) {
        porAcao[Number(r[2 + i])] += Number(r[r.length - 1]);
      }
      const acoes = etapa.acoes.map((rotulo, j) => ({
        rotulo,
        valor: porAcao[j],
        status: status[i][j],
        cor: COR_STATUS[status[i][j]],
      }));
      return { chave: etapa.chave, titulo: etapa.titulo, acoes };
    });
  });

  /** Barras da visão 1: só ações com retificações, a de maior número no topo. */
  readonly graficos = computed(() =>
    this.porEtapa().map((e) => ({
      chave: e.chave,
      titulo: e.titulo,
      barras: e.acoes
        .filter((a) => a.valor > 0)
        .map((a): Barra => ({ rotulo: a.rotulo, valor: a.valor, cor: a.cor }))
        .reverse(),
    })),
  );

  /** Seleção dos segmentadores: clique seleciona só o item, Ctrl+clique soma ou remove. */
  selecionar(alvo: 'anos' | 'meses' | 'cidades', valor: number, evento: MouseEvent): void {
    this.sinal(alvo).update((atual) => {
      if (evento.ctrlKey || evento.metaKey) {
        const novo = new Set(atual);
        if (novo.has(valor)) {
          novo.delete(valor);
        } else {
          novo.add(valor);
        }
        return novo;
      }
      return atual.size === 1 && atual.has(valor) ? new Set() : new Set([valor]);
    });
  }

  definir(alvo: 'anos' | 'meses' | 'cidades', valores: number[]): void {
    this.sinal(alvo).set(new Set(valores));
  }

  limparFiltros(): void {
    this.anosSel.set(new Set());
    this.mesesSel.set(new Set());
    this.cidadesSel.set(new Set());
  }

  private sinal(alvo: 'anos' | 'meses' | 'cidades') {
    return alvo === 'anos' ? this.anosSel : alvo === 'meses' ? this.mesesSel : this.cidadesSel;
  }

  /** Abre no período mais recente que não passou de hoje, com todos os municípios. */
  private selecionarPadrao(dados: DadosPainel): void {
    const hoje = new Date();
    const atual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const periodos = [...new Set(dados.registros.map((r) => String(r[0])))].sort();
    const periodo = periodos.filter((p) => p <= atual).pop() ?? periodos[0];
    if (!periodo) return;
    const [ano, mes] = periodo.split('-').map(Number);
    this.anosSel.set(new Set([ano]));
    this.mesesSel.set(new Set([mes]));
    this.cidadesSel.set(new Set());
  }
}
