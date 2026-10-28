/** Dados prontos para exibição nas páginas do portal, montados a partir do painel da API. */

/** Tom visual do `.badge` (atributo `data-tom`). */
export type TomBadge = 'concluido' | 'pendente' | 'aguardando' | 'pausado' | 'atraso' | 'cancelado';

export interface ItemAtividade {
  /** Texto do campo sprint da atividade. */
  sprint: string;
  id: string;
  funcionalidade: string;
  descricao: string;
  responsavel: string;
  status: string;
  tom: TomBadge;
  observacoes: string;
}

export interface ProximaSprint {
  /** Nome com o período, ex.: "Sprint 6 - 05.10.2026 a 16.10.2026". */
  rotulo: string;
  objetivo: string;
  itens: ItemAtividade[];
}

export interface EvolucaoSprint {
  sprint: string;
  planejadas: number;
  /** Nulo enquanto a sprint não começou a entregar. */
  entregues: number | null;
  acumuladas: number;
}

export interface BurndownSprint {
  /** Nome curto, ex.: "Sprint 3". */
  sprint: string;
  /** Nome com o período, ex.: "Sprint 3 - 24.08.2026 a 04.09.2026". */
  rotulo: string;
  planejadas: number;
  /** Nulo enquanto a sprint não começou a entregar. */
  entregues: number | null;
  /** Tarefas que deveriam restar ao fim da sprint se o planejado fosse cumprido. */
  meta: number;
  /** Tarefas que de fato restam ao fim da sprint; nulo enquanto ela não entregou. */
  restante: number | null;
}

export interface Burndown {
  /** Soma das tarefas planejadas de todas as sprints. */
  total: number;
  linhas: BurndownSprint[];
}

export interface DesempenhoSprint {
  /** Nome curto, ex.: "Sprint 3". */
  sprint: string;
  /** dd/MM/yyyy a dd/MM/yyyy (vazio sem datas). */
  periodo: string;
  planejadas: number;
  /** Nulo enquanto a sprint não começou a entregar. */
  concluidas: number | null;
  /** 0 a 100; nulo sem entregas ou sem planejadas. */
  percentual: number | null;
  status: string;
  tom: TomBadge;
}

export interface ResumoSprints {
  sprintsConcluidas: number;
  totalSprints: number;
  /** Planejadas e desenvolvidas somando só as sprints concluídas. */
  planejadas: number;
  entregues: number;
  /** Atividades com status Homologado no projeto. */
  homologadas: number;
  /** Homologadas ÷ planejadas das sprints concluídas, 0 a 100 (nulo sem planejadas). */
  aderencia: number | null;
  linhas: DesempenhoSprint[];
}

export interface PendenciaPainel {
  id: string;
  tema: string;
  pergunta: string;
  responsavel: string;
  /** dd/MM/yyyy */
  prazo: string;
  status: string;
  tom: TomBadge;
  impacto: string;
  /** ALTO, MEDIO ou BAIXO (atributo `data-nivel`). */
  nivelImpacto: string;
}

export interface RiscoPainel {
  id: string;
  risco: string;
  descricao: string;
  impacto: string;
  nivelImpacto: string;
  probabilidade: string;
  nivelProbabilidade: string;
  mitigacao: string;
  responsavel: string;
  status: string;
  tom: TomBadge;
}

export interface ImpactoPainel {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  tipoValor: string;
  tarefasAfetadas: string;
  acaoCliente: string;
  pendenciaId: string;
  pendenciaTema: string;
  impacto: string;
  nivelImpacto: string;
  status: string;
  tom: TomBadge;
  ativo: boolean;
}

export interface FluxoBizagi {
  seq: number;
  id: string;
  nome: string;
  descricao: string;
  status: string;
  tom: TomBadge;
  /** dd/MM/yyyy */
  atualizadoEm: string;
}
