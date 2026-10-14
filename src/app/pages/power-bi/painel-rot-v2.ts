import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { Pagina } from '../../models/admin.models';
import { mensagemErro } from '../../services/admin-api.service';
import {
  COR_STATUS,
  DadosPainel,
  MESES,
  PainelRotStore,
  SITUACAO_API,
  STATUS,
  StatusAcao,
  urlPainel,
} from './painel-rot.store';

type SituacaoApi = 'FINALIZADA' | 'EM_ANDAMENTO' | 'IMPEDIMENTO' | 'NAO_INICIADA';

interface EtapaApi {
  acao: string;
  status: SituacaoApi;
  responsavel: string | null;
  dataInicio: string | null;
  dataConclusao: string | null;
  observacoes: string | null;
}

/** `GET /api/projetos/{id}/retificacoes` */
interface RetificacaoApi {
  id: string;
  linha: number;
  codEstab: string | null;
  cnpj: string | null;
  bairro: string | null;
  cidade: string;
  /** yyyy-MM-dd (primeiro dia do mês) */
  periodo: string;
  situacao: SituacaoApi;
  assessment: EtapaApi;
  divergencias: string | null;
  ajustes: EtapaApi;
  geracao: EtapaApi;
  entrega: EtapaApi;
  statusFinal: string | null;
}

const STATUS_DA_SITUACAO: Record<SituacaoApi, StatusAcao> = {
  FINALIZADA: 'finalizado',
  EM_ANDAMENTO: 'andamento',
  IMPEDIMENTO: 'impedimento',
  NAO_INICIADA: 'nao_iniciado',
};

const ETAPAS_TABELA: { chave: 'assessment' | 'ajustes' | 'geracao' | 'entrega'; titulo: string }[] = [
  { chave: 'assessment', titulo: 'Assessment' },
  { chave: 'ajustes', titulo: 'Ajustes' },
  { chave: 'geracao', titulo: 'Geração' },
  { chave: 'entrega', titulo: 'Entrega' },
];

/** Paginação e ordenação escolhidas na tabela. */
interface Navegacao {
  filtros: unknown;
  first: number;
  rows: number;
  sortField: string;
  sortOrder: number;
}

/** Visão 2: indicadores clicáveis, filtros compactos e lista dos estabelecimentos. */
@Component({
  selector: 'app-painel-rot-v2',
  imports: [TableModule],
  templateUrl: './painel-rot-v2.html',
  styleUrl: './painel-rot-v2.scss',
})
export class PainelRotV2Component {
  private readonly http = inject(HttpClient);
  readonly store = inject(PainelRotStore);

  readonly dados = input.required<DadosPainel>();
  readonly linkPowerBi = input<string | null>(null);

  readonly meses = MESES;
  readonly etapasTabela = ETAPAS_TABELA;

  /** Situação escolhida nos cartões; filtra a tabela. */
  readonly situacao = signal<StatusAcao | null>(null);
  readonly rotuloSituacao = computed(
    () => STATUS.find((s) => s.chave === this.situacao())?.rotulo ?? null,
  );
  readonly busca = signal('');
  termo = '';

  readonly municipiosAbertos = signal(false);
  readonly filtroMunicipio = signal('');
  private readonly seletorMunicipios = viewChild<ElementRef<HTMLElement>>('seletorMunicipios');

  readonly municipiosVisiveis = computed(() => {
    const termo = normalizar(this.filtroMunicipio());
    return this.store
      .cidades()
      .map((nome, indice) => ({ nome, indice }))
      .filter((c) => !termo || normalizar(c.nome).includes(termo));
  });

  readonly rotuloMunicipios = computed(() => {
    const nomes = this.store.nomesCidadesSel();
    if (!nomes.length) return 'Todos os municípios';
    return nomes.length === 1 ? nomes[0] : `${nomes.length} municípios`;
  });

  readonly temFiltros = computed(
    () =>
      this.store.anosSel().size > 0 ||
      this.store.mesesSel().size > 0 ||
      this.store.cidadesSel().size > 0 ||
      this.situacao() !== null ||
      this.busca() !== '',
  );

  private readonly filtrosTabela = computed(() => ({
    projetoId: this.store.projetoId(),
    versao: this.store.versaoDados(),
    anos: [...this.store.anosSel()],
    meses: [...this.store.mesesSel()],
    cidades: this.store.nomesCidadesSel(),
    situacao: this.situacao(),
    q: this.busca(),
  }));
  private readonly navegacao = signal<Navegacao | null>(null);

  /** A tabela volta à primeira página sempre que um filtro muda. */
  readonly consulta = computed(() => {
    const filtros = this.filtrosTabela();
    const nav = this.navegacao();
    return {
      filtros,
      first: nav && nav.filtros === filtros ? nav.first : 0,
      rows: nav?.rows ?? 20,
      sortField: nav?.sortField ?? 'codEstab',
      sortOrder: nav?.sortOrder ?? 1,
    };
  });

  readonly linhas = signal<RetificacaoApi[]>([]);
  readonly totalRegistros = signal(0);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly exportando = signal(false);

  /** Os cartões indicam retificações, mas a lista veio vazia: planilha enviada antes da lista existir. */
  readonly faltamLinhas = computed(() => {
    if (this.carregando() || this.totalRegistros() > 0 || this.busca()) return false;
    const situacao = this.situacao();
    const esperado = situacao
      ? (this.store.indicadores().find((k) => k.chave === situacao)?.valor ?? 0)
      : this.store.total();
    return esperado > 0;
  });

  constructor() {
    toObservable(this.consulta)
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.carregando.set(true)),
        switchMap((consulta) => {
          const { filtros, first, rows } = consulta;
          if (!filtros.projetoId) return of(null);
          const params = parametrosFiltro(consulta)
            .set('page', Math.floor(first / rows))
            .set('size', rows);
          return this.http
            .get<Pagina<RetificacaoApi>>(`${urlPainel(filtros.projetoId)}/retificacoes`, {
              params,
            })
            .pipe(
              map((pagina) => ({ pagina, erro: null })),
              catchError((e) => of({ pagina: null, erro: mensagemErro(e) })),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        if (!r) return;
        this.carregando.set(false);
        this.erro.set(r.erro);
        this.linhas.set(r.pagina?.content ?? []);
        this.totalRegistros.set(r.pagina?.page.totalElements ?? 0);
      });
  }

  @HostListener('document:click', ['$event'])
  fecharMunicipios(evento: MouseEvent): void {
    const seletor = this.seletorMunicipios()?.nativeElement;
    if (this.municipiosAbertos() && seletor && !seletor.contains(evento.target as Node)) {
      this.municipiosAbertos.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  fecharComEsc(): void {
    this.municipiosAbertos.set(false);
  }

  /** Paginação e ordenação da tabela (modo lazy: a API pagina e ordena). */
  navegar(evento: TableLazyLoadEvent): void {
    const atual = this.consulta();
    const sortField = typeof evento.sortField === 'string' ? evento.sortField : atual.sortField;
    const sortOrder = evento.sortOrder ?? atual.sortOrder;
    const mudouOrdem = sortField !== atual.sortField || sortOrder !== atual.sortOrder;
    this.navegacao.set({
      filtros: atual.filtros,
      first: mudouOrdem ? 0 : (evento.first ?? atual.first),
      rows: evento.rows ?? atual.rows,
      sortField,
      sortOrder,
    });
  }

  /** Baixa em .xlsx todas as linhas do filtro atual, na ordenação da tabela. */
  exportar(): void {
    const consulta = this.consulta();
    if (!consulta.filtros.projetoId || this.exportando()) return;
    this.exportando.set(true);
    this.erro.set(null);
    this.http
      .get(`${urlPainel(consulta.filtros.projetoId)}/retificacoes/exportacao`, {
        params: parametrosFiltro(consulta),
        responseType: 'blob',
      })
      .subscribe({
        next: (arquivo) => {
          this.exportando.set(false);
          const url = URL.createObjectURL(arquivo);
          const link = document.createElement('a');
          link.href = url;
          link.download = `retificacoes-${this.store.descricaoPeriodo().replace(/[^\p{L}\d]+/gu, '-')}.xlsx`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (e) => {
          this.exportando.set(false);
          this.erro.set(mensagemErro(e));
        },
      });
  }

  /** Valor do select de ano/mês: o item escolhido, "" (todos) ou "varios" (seleção feita na visão 1). */
  valorSelect(selecao: Set<number>): string {
    if (selecao.size === 0) return '';
    return selecao.size === 1 ? String([...selecao][0]) : 'varios';
  }

  escolherPeriodo(alvo: 'anos' | 'meses', valor: string): void {
    if (valor === 'varios') return;
    this.store.definir(alvo, valor ? [Number(valor)] : []);
  }

  alternarMunicipio(indice: number): void {
    const atual = new Set(this.store.cidadesSel());
    if (atual.has(indice)) {
      atual.delete(indice);
    } else {
      atual.add(indice);
    }
    this.store.definir('cidades', [...atual]);
  }

  removerMunicipio(nome: string): void {
    const indice = this.store.cidades().indexOf(nome);
    this.store.definir(
      'cidades',
      [...this.store.cidadesSel()].filter((i) => i !== indice),
    );
  }

  escolherSituacao(chave: StatusAcao | null): void {
    this.situacao.set(this.situacao() === chave ? null : chave);
  }

  buscar(): void {
    this.busca.set(this.termo.trim());
  }

  limparFiltros(): void {
    this.store.limparFiltros();
    this.situacao.set(null);
    this.termo = '';
    this.busca.set('');
  }

  corDaSituacao(situacao: SituacaoApi): string {
    return COR_STATUS[STATUS_DA_SITUACAO[situacao]];
  }

  rotuloDaSituacao(situacao: SituacaoApi): string {
    return STATUS.find((s) => s.chave === STATUS_DA_SITUACAO[situacao])?.rotulo ?? situacao;
  }

  dicaEtapa(etapa: EtapaApi): string {
    return [
      etapa.acao,
      etapa.responsavel && `Responsável: ${etapa.responsavel}`,
      etapa.dataInicio && `Início: ${dataBr(etapa.dataInicio)}`,
      etapa.dataConclusao && `Conclusão: ${dataBr(etapa.dataConclusao)}`,
      etapa.observacoes && `Obs.: ${etapa.observacoes}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  cnpj(valor: string | null): string {
    if (!valor) return '';
    const d = valor.padStart(14, '0');
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }

  periodo(valor: string): string {
    const [ano, mes] = valor.split('-');
    return `${mes}/${ano}`;
  }

  readonly dataBr = dataBr;
}

/** Filtros e ordenação comuns à lista e à exportação. */
function parametrosFiltro(consulta: ReturnType<PainelRotV2Component['consulta']>): HttpParams {
  const { filtros, sortField, sortOrder } = consulta;
  let params = new HttpParams()
    .set('sort', sortField)
    .set('direction', sortOrder < 0 ? 'DESC' : 'ASC');
  filtros.anos.forEach((a) => (params = params.append('ano', a)));
  filtros.meses.forEach((m) => (params = params.append('mes', m)));
  filtros.cidades.forEach((c) => (params = params.append('cidade', c)));
  if (filtros.situacao) params = params.set('situacao', SITUACAO_API[filtros.situacao]);
  if (filtros.q) params = params.set('q', filtros.q);
  return params;
}

function dataBr(valor: string | null): string {
  if (!valor) return '-';
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
