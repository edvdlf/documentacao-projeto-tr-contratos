export interface FluxoBizagi {
  seq: number;
  id: string;
  nome: string;
  descricao: string;
  /** PNG do diagrama em /public/fluxos */
  imagem: string;
  status: string;
  atualizadoEm: string;
}

export interface ResumoTotais {
  sprintsNoResumo: number;
  itensPlanejados: number;
  itensEntregues: number;
  aderencia: string;
}

export interface DesempenhoSprint {
  sprint: string;
  planejados: number;
  concluidos: number;
  percentual: string;
  status: string;
  periodo: string;
}

export interface ResumoSprint {
  titulo: string;
  subtitulo: string;
  totais: ResumoTotais;
  desempenho: DesempenhoSprint[];
  observacao: string;
}

export interface ItemEntrega {
  sprint: string;
  id: string;
  funcionalidade: string;
  descricao: string;
  responsavel: string;
  status: string;
  observacoes: string;
}

export interface Pendencia {
  id: string;
  tema: string;
  pergunta: string;
  responsavel: string;
  prazo: string;
  status: string;
  impacto: string;
}

export interface EvolucaoSprint {
  sprint: string;
  planejadas: number;
  entregues: number | null;
  acumuladas: number;
}

export interface Risco {
  id: string;
  risco: string;
  descricao: string;
  impacto: string;
  probabilidade: string;
  mitigacao: string;
  responsavel: string;
  status: string;
}

export interface ProjetoConteudo {
  fonte?: string;
  geradoEm?: string;
  resumo: ResumoSprint;
  entregues: ItemEntrega[];
  proximaSprint: ItemEntrega[];
  pendencias: Pendencia[];
  evolucao: EvolucaoSprint[];
  riscos: Risco[];
  fluxos: FluxoBizagi[];
}
