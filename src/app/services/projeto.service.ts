import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { recursosDoProjeto } from '../data/projeto.recursos';
import {
  Atividade,
  Pagina,
  Painel,
  Projeto,
  Sprint,
  Usuario,
  dataBr,
  rotuloNivel,
  rotuloStatus,
} from '../models/admin.models';
import {
  Burndown,
  DesempenhoSprint,
  EvolucaoSprint,
  FluxoBizagi,
  ItemAtividade,
  PendenciaPainel,
  ProximaSprint,
  ResumoSprints,
  RiscoPainel,
  TomBadge,
} from '../models/projeto.models';
import { mensagemErro } from './admin-api.service';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'vetorit.projeto';
/** Ao abrir uma página logo depois de outra carga, reaproveita os dados. */
const INTERVALO_MINIMO_MS = 3000;

/** Dados exibidos no portal, vindos de `GET /api/projetos/{id}/painel`. */
@Injectable({ providedIn: 'root' })
export class ProjetoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/api/projetos`;

  readonly carregado = signal(false);
  readonly erro = signal<string | null>(null);
  readonly projetos = signal<Projeto[]>([]);
  private readonly painel = signal<Painel | null>(null);
  private painelCarregadoEm = 0;

  readonly projetoAtual = computed(() => this.painel()?.projeto ?? null);

  readonly recursos = computed(() => recursosDoProjeto(this.projetoAtual()));

  private readonly sprints = computed(() =>
    (this.painel()?.sprints ?? []).filter((s) => s.status !== 'CANCELADA'),
  );

  /** Atividades na ordem das sprints (pela data) e, dentro da sprint, pelo código. */
  private readonly atividades = computed(() => {
    const sprints = this.sprints();
    const posicao = (a: Atividade) => {
      const i = sprints.findIndex((s) => pertence(a.sprint, s));
      return i < 0 ? sprints.length : i;
    };
    return [...(this.painel()?.atividades ?? [])].sort(
      (a, b) =>
        posicao(a) - posicao(b) ||
        (a.sprint ?? '').localeCompare(b.sprint ?? '', 'pt-BR', { numeric: true }) ||
        a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }),
    );
  });

  readonly entregues = computed(() =>
    this.atividades()
      .filter((a) => a.status === 'CONCLUIDA' || a.status === 'HOMOLOGADO')
      .map(itemAtividade),
  );

  readonly sprintsEntregues = computed(() => [
    ...new Set(this.entregues().map((i) => i.sprint).filter(Boolean)),
  ]);

  /** Primeira sprint (pela data) ainda não concluída, com as atividades dela. */
  readonly proximaSprint = computed<ProximaSprint | null>(() => {
    const sprint = this.sprints().find((s) => s.status !== 'CONCLUIDA');
    if (!sprint) return null;
    return {
      rotulo: sprint.rotulo,
      objetivo: sprint.objetivo ?? '',
      itens: this.atividades()
        .filter((a) => pertence(a.sprint, sprint))
        .map(itemAtividade),
    };
  });

  readonly evolucao = computed<EvolucaoSprint[]>(() => {
    let acumuladas = 0;
    return this.sprints().map((s) => {
      const entregues = semEntregas(s) ? null : s.executadas;
      acumuladas += entregues ?? 0;
      return { sprint: s.rotulo, planejadas: s.planejadas, entregues, acumuladas };
    });
  });

  /** Burndown do projeto: do total planejado, quanto deveria restar (meta) e quanto resta. */
  readonly burndown = computed<Burndown>(() => {
    const sprints = this.sprints();
    const total = sprints.reduce((acc, s) => acc + s.planejadas, 0);
    let meta = total;
    let restante = total;
    const linhas = sprints.map((s) => {
      const entregues = semEntregas(s) ? null : s.executadas;
      meta = Math.max(0, meta - s.planejadas);
      if (entregues !== null) restante = Math.max(0, restante - entregues);
      return {
        sprint: s.nome,
        rotulo: s.rotulo,
        planejadas: s.planejadas,
        entregues,
        meta,
        restante: entregues === null ? null : restante,
      };
    });
    return { total, linhas };
  });

  /** Aba "Resumo da Sprint": desempenho de cada sprint e indicadores das já concluídas. */
  readonly resumoSprints = computed<ResumoSprints>(() => {
    const linhas: DesempenhoSprint[] = this.sprints().map((s) => {
      const concluidas = semEntregas(s) ? null : s.executadas;
      return {
        sprint: s.nome,
        periodo:
          s.dataInicio && s.dataFim ? `${dataBr(s.dataInicio)} a ${dataBr(s.dataFim)}` : '',
        planejadas: s.planejadas,
        concluidas,
        percentual:
          concluidas === null || !s.planejadas
            ? null
            : Math.round((concluidas / s.planejadas) * 100),
        status: rotuloStatus(s.status),
        tom: tomSprint(s.status),
      };
    });
    const concluidas = this.sprints().filter((s) => s.status === 'CONCLUIDA');
    const planejadas = concluidas.reduce((acc, s) => acc + s.planejadas, 0);
    const entregues = concluidas.reduce((acc, s) => acc + s.executadas, 0);
    const homologadas = this.atividades().filter((a) => a.status === 'HOMOLOGADO').length;
    return {
      sprintsConcluidas: concluidas.length,
      totalSprints: linhas.length,
      planejadas,
      entregues,
      homologadas,
      aderencia: planejadas ? Math.round((homologadas / planejadas) * 100) : null,
      linhas,
    };
  });

  /** Totais da evolução: desenvolvidas, homologadas e a desenvolver. */
  readonly resumoTarefas = computed(() => {
    const evo = this.evolucao();
    const planejadoTotal = evo.reduce((acc, s) => acc + (s.planejadas || 0), 0);
    const desenvolvidas = this.atividades().filter((a) => a.status === 'CONCLUIDA').length;
    const homologadas = this.atividades().filter((a) => a.status === 'HOMOLOGADO').length;
    return {
      planejadoTotal,
      desenvolvidas,
      homologadas,
      aDesenvolver: Math.max(0, planejadoTotal - desenvolvidas - homologadas),
      percentualDesenvolvidas: planejadoTotal
        ? Math.round((desenvolvidas / planejadoTotal) * 100)
        : 0,
      percentualHomologadas: planejadoTotal
        ? Math.round((homologadas / planejadoTotal) * 100)
        : 0,
    };
  });

  readonly pendencias = computed<PendenciaPainel[]>(() =>
    (this.painel()?.pendencias ?? []).map((p) => ({
      id: p.codigo,
      tema: p.tema,
      pergunta: p.pergunta ?? '',
      responsavel: p.responsavel ?? '',
      prazo: p.prazo ? dataBr(p.prazo) : '',
      status: rotuloStatus(p.status),
      tom: tom(p.status),
      impacto: rotuloNivel(p.impacto),
      nivelImpacto: p.impacto ?? '',
    })),
  );

  readonly riscos = computed<RiscoPainel[]>(() =>
    (this.painel()?.riscos ?? []).map((r) => ({
      id: r.codigo,
      risco: r.titulo,
      descricao: r.descricao ?? '',
      impacto: rotuloNivel(r.impacto),
      nivelImpacto: r.impacto ?? '',
      probabilidade: rotuloNivel(r.probabilidade, true),
      nivelProbabilidade: r.probabilidade ?? '',
      mitigacao: r.mitigacao ?? '',
      responsavel: r.responsavel ?? '',
      status: rotuloStatus(r.status),
      tom: tom(r.status),
    })),
  );

  readonly fluxos = computed<FluxoBizagi[]>(() =>
    (this.painel()?.fluxos ?? []).map((f) => ({
      seq: f.seq,
      id: f.codigo,
      nome: f.nome,
      descricao: f.descricao ?? '',
      status: rotuloStatus(f.status),
      tom: tom(f.status),
      atualizadoEm: f.dataAtualizacao ? dataBr(f.dataAtualizacao) : '',
    })),
  );

  /** Carrega os projetos que o usuário logado pode ver e o painel do projeto em acompanhamento. */
  async carregar(): Promise<void> {
    const usuario = this.auth.user();
    if (!usuario) {
      this.limpar();
      return;
    }
    try {
      const pagina = await firstValueFrom(
        this.http.get<Pagina<Projeto>>(this.base, {
          params: { size: 200, sort: 'nome', direction: 'ASC' },
        }),
      );
      let visiveis = pagina.content;
      if (usuario.perfil !== 'ADMIN') {
        const cadastro = await firstValueFrom(
          this.http.get<Usuario>(`${environment.apiUrl}/api/usuarios/${usuario.id}`),
        );
        const vinculados = new Set(cadastro.projetos.map((p) => p.id));
        visiveis = visiveis.filter((p) => vinculados.has(p.id));
      }
      if (this.auth.user()?.id !== usuario.id) return;

      this.projetos.set(visiveis);
      const escolhido = escolherProjeto(visiveis, lerProjetoSalvo());
      if (escolhido) {
        await this.buscarPainel(escolhido.id);
      } else {
        this.painel.set(null);
        this.erro.set(
          usuario.perfil === 'ADMIN'
            ? 'Nenhum projeto cadastrado. Cadastre um projeto em Administração > Projetos.'
            : 'Seu usuário não está vinculado a nenhum projeto. Procure um administrador.',
        );
      }
    } catch (e) {
      this.erro.set(`Não foi possível carregar os dados da API: ${mensagemErro(e)}`);
    } finally {
      this.carregado.set(true);
    }
  }

  /** Recarrega projetos e painel ao abrir uma página (reflete o que foi alterado na Administração). */
  async atualizar(): Promise<void> {
    if (Date.now() - this.painelCarregadoEm < INTERVALO_MINIMO_MS) return;
    await this.carregar();
  }

  /** Descarta os dados do usuário anterior (chamar ao sair). */
  limpar(): void {
    this.projetos.set([]);
    this.painel.set(null);
    this.painelCarregadoEm = 0;
    this.erro.set(null);
  }

  async selecionarProjeto(id: string): Promise<void> {
    if (!this.projetos().some((p) => p.id === id)) return;
    salvarProjeto(id);
    try {
      await this.buscarPainel(id);
    } catch (e) {
      this.erro.set(`Não foi possível carregar os dados da API: ${mensagemErro(e)}`);
    }
  }

  private async buscarPainel(projetoId: string): Promise<void> {
    const painel = await firstValueFrom(
      this.http.get<Painel>(`${this.base}/${projetoId}/painel`),
    );
    this.painel.set(painel);
    this.painelCarregadoEm = Date.now();
    this.erro.set(null);
    salvarProjeto(projetoId);
  }
}

/** Mesma regra da API: o campo sprint é igual ao nome ou começa por ele seguido de espaço. */
function pertence(textoSprint: string | null, sprint: Sprint): boolean {
  if (!textoSprint) return false;
  const texto = textoSprint.trim().toLowerCase();
  const nome = sprint.nome.toLowerCase();
  return texto === nome || texto.startsWith(`${nome} `);
}

/** Sprint que ainda não começou a entregar: sem execução informada nem atividades concluídas. */
function semEntregas(s: Sprint): boolean {
  return s.status === 'PLANEJADA' && s.tarefasExecutadas === null && s.executadas === 0;
}

function tomSprint(status: Sprint['status']): TomBadge {
  switch (status) {
    case 'CONCLUIDA':
    case 'HOMOLOGADO':
      return 'concluido';
    case 'EM_ANDAMENTO':
      return 'aguardando';
    case 'PAUSADO':
      return 'pausado';
    case 'CANCELADA':
      return 'cancelado';
    default:
      return 'pendente';
  }
}

function itemAtividade(a: Atividade): ItemAtividade {
  return {
    sprint: a.sprint ?? '',
    id: a.codigo,
    funcionalidade: a.titulo,
    descricao: a.descricao ?? '',
    responsavel: a.responsavel ?? '',
    status: rotuloStatus(a.status),
    tom: tom(a.status),
    observacoes: a.observacoes ?? '',
  };
}

function tom(status: string): TomBadge {
  switch (status) {
    case 'CONCLUIDA':
    case 'CONCLUIDO':
    case 'RESOLVIDA':
    case 'RESOLVIDO':
    case 'MITIGADO':
    case 'APROVADO':
    case 'HOMOLOGADO':
      return 'concluido';
    case 'AGUARDANDO_APROVACAO':
      return 'aguardando';
    case 'PAUSADO':
      return 'pausado';
    case 'EM_ATRASO':
    case 'BLOQUEADA':
      return 'atraso';
    case 'CANCELADA':
    case 'CANCELADO':
    case 'INATIVO':
      return 'cancelado';
    default:
      return 'pendente';
  }
}

function escolherProjeto(projetos: Projeto[], salvo: string | null): Projeto | undefined {
  return (
    projetos.find((p) => p.id === salvo) ??
    projetos.find((p) => p.status === 'EM_ANDAMENTO') ??
    projetos[0]
  );
}

function lerProjetoSalvo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function salvarProjeto(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}
