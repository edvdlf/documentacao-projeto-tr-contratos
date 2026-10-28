/** Tipos da API do backend (Spring Boot), usados pela área administrativa. */

export type StatusProjeto =
  | 'PLANEJADO'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'HOMOLOGADO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type StatusAtividade =
  | 'PLANEJADA'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'HOMOLOGADO'
  | 'CONCLUIDA'
  | 'BLOQUEADA'
  | 'CANCELADA';

export const STATUS_PROJETO: { valor: StatusProjeto; rotulo: string }[] = [
  { valor: 'PLANEJADO', rotulo: 'Planejado' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'CONCLUIDO', rotulo: 'Concluído' },
  { valor: 'CANCELADO', rotulo: 'Cancelado' },
];

export const STATUS_ATIVIDADE: { valor: StatusAtividade; rotulo: string }[] = [
  { valor: 'PLANEJADA', rotulo: 'Planejada' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'CONCLUIDA', rotulo: 'Concluída' },
  { valor: 'BLOQUEADA', rotulo: 'Bloqueada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export type StatusSprint =
  | 'PLANEJADA'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'HOMOLOGADO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type StatusFluxo =
  | 'NAO_INICIADO'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'HOMOLOGADO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'INATIVO';

export const STATUS_SPRINT: { valor: StatusSprint; rotulo: string }[] = [
  { valor: 'PLANEJADA', rotulo: 'Planejada' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'CONCLUIDA', rotulo: 'Concluída' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export const STATUS_FLUXO: { valor: StatusFluxo; rotulo: string }[] = [
  { valor: 'NAO_INICIADO', rotulo: 'Não iniciado' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'AGUARDANDO_APROVACAO', rotulo: 'Aguardando aprovação' },
  { valor: 'APROVADO', rotulo: 'Aprovado' },
  { valor: 'INATIVO', rotulo: 'Inativo' },
];

export type StatusPendencia =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'PAUSADO'
  | 'HOMOLOGADO'
  | 'EM_ATRASO'
  | 'RESOLVIDA'
  | 'CANCELADA';

export type StatusRisco = 'ABERTO' | 'EM_TRATAMENTO' | 'PAUSADO' | 'HOMOLOGADO' | 'MITIGADO' | 'RESOLVIDO';

export type TipoImpacto = 'BLOQUEIO_INICIO' | 'BLOQUEIO_FINALIZACAO' | 'BLOQUEIO_HOMOLOGACAO';

export type StatusImpacto = 'ATIVO' | 'RESOLVIDO' | 'CANCELADO';

export type Nivel = 'BAIXO' | 'MEDIO' | 'ALTO';

export const STATUS_PENDENCIA: { valor: StatusPendencia; rotulo: string }[] = [
  { valor: 'ABERTA', rotulo: 'Aberta' },
  { valor: 'EM_ANALISE', rotulo: 'Em análise' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'EM_ATRASO', rotulo: 'Em atraso' },
  { valor: 'RESOLVIDA', rotulo: 'Resolvida' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export const STATUS_RISCO: { valor: StatusRisco; rotulo: string }[] = [
  { valor: 'ABERTO', rotulo: 'Aberto' },
  { valor: 'EM_TRATAMENTO', rotulo: 'Em tratamento' },
  { valor: 'PAUSADO', rotulo: 'Em Pausa' },
  { valor: 'HOMOLOGADO', rotulo: 'Homologado' },
  { valor: 'MITIGADO', rotulo: 'Mitigado' },
  { valor: 'RESOLVIDO', rotulo: 'Resolvido' },
];

export const STATUS_IMPACTO: { valor: StatusImpacto; rotulo: string }[] = [
  { valor: 'ATIVO', rotulo: 'Ativo' },
  { valor: 'RESOLVIDO', rotulo: 'Resolvido' },
  { valor: 'CANCELADO', rotulo: 'Cancelado' },
];

export const TIPOS_IMPACTO: { valor: TipoImpacto; rotulo: string }[] = [
  { valor: 'BLOQUEIO_INICIO', rotulo: 'Não pode iniciar' },
  { valor: 'BLOQUEIO_FINALIZACAO', rotulo: 'Não pode finalizar' },
  { valor: 'BLOQUEIO_HOMOLOGACAO', rotulo: 'Não pode homologar' },
];

export function rotuloTipoImpacto(tipo: TipoImpacto | null | undefined): string {
  return TIPOS_IMPACTO.find((t) => t.valor === tipo)?.rotulo ?? tipo ?? '';
}

export const NIVEIS: { valor: Nivel; rotulo: string }[] = [
  { valor: 'ALTO', rotulo: 'Alto' },
  { valor: 'MEDIO', rotulo: 'Médio' },
  { valor: 'BAIXO', rotulo: 'Baixo' },
];

/** Rótulo do nível; `feminino` para concordar com "probabilidade" (Alta, Média, Baixa). */
export function rotuloNivel(nivel: Nivel | null | undefined, feminino = false): string {
  if (!nivel) return '';
  const rotulos: Record<Nivel, [string, string]> = {
    ALTO: ['Alto', 'Alta'],
    MEDIO: ['Médio', 'Média'],
    BAIXO: ['Baixo', 'Baixa'],
  };
  return rotulos[nivel][feminino ? 1 : 0];
}

type Status =
  | StatusProjeto
  | StatusAtividade
  | StatusSprint
  | StatusFluxo
  | StatusPendencia
  | StatusRisco
  | StatusImpacto;

const ROTULOS: Record<string, string> = Object.fromEntries(
  [
    ...STATUS_PROJETO,
    ...STATUS_ATIVIDADE,
    ...STATUS_SPRINT,
    ...STATUS_FLUXO,
    ...STATUS_PENDENCIA,
    ...STATUS_RISCO,
    ...STATUS_IMPACTO,
  ].map((s) => [s.valor, s.rotulo]),
);

export function rotuloStatus(status: Status): string {
  return ROTULOS[status] ?? status;
}

/** Tom visual do badge de status (atributo `data-tom` do `.adm-badge`). */
export function tomStatus(status: Status): string {
  switch (status) {
    case 'EM_ANDAMENTO':
    case 'EM_ANALISE':
    case 'EM_TRATAMENTO':
      return 'andamento';
    case 'CONCLUIDO':
    case 'CONCLUIDA':
    case 'APROVADO':
    case 'HOMOLOGADO':
    case 'RESOLVIDA':
    case 'RESOLVIDO':
    case 'MITIGADO':
      return 'concluido';
    case 'ATIVO':
      return 'alerta';
    case 'PAUSADO':
      return 'pausado';
    case 'BLOQUEADA':
    case 'AGUARDANDO_APROVACAO':
    case 'EM_ATRASO':
      return 'alerta';
    case 'CANCELADO':
    case 'CANCELADA':
    case 'INATIVO':
      return 'cancelado';
    default:
      return 'neutro';
  }
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`, sem passar por Date (evita deslocamento de fuso). */
export function dataBr(valor: string | null | undefined): string {
  if (!valor) return '-';
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

export interface Pagina<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface Listagem {
  page: number;
  size: number;
  sort: string;
  direction: 'ASC' | 'DESC';
}

export interface Projeto {
  id: string;
  codigo: string;
  nome: string;
  nomeCurto: string | null;
  cliente: string | null;
  descricao: string | null;
  status: StatusProjeto;
  /** yyyy-MM-dd */
  dataInicio: string | null;
  dataFim: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProjetoRequest {
  codigo: string;
  nome: string;
  nomeCurto: string | null;
  cliente: string | null;
  descricao: string | null;
  status: StatusProjeto;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface Atividade {
  id: string;
  projetoId: string;
  codigo: string;
  sprint: string | null;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  status: StatusAtividade;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AtividadeRequest {
  codigo: string;
  sprint: string | null;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  status: StatusAtividade;
  observacoes: string | null;
}

export interface Sprint {
  id: string;
  projetoId: string;
  nome: string;
  /** Nome com o período ("Sprint 3 - 24.08.2026 a 04.09.2026"), como no campo sprint das atividades. */
  rotulo: string;
  dataInicio: string | null;
  dataFim: string | null;
  objetivo: string | null;
  status: StatusSprint;
  totalAtividades: number;
  atividadesConcluidas: number;
  /** Informado na sprint; null = usa a contagem das atividades. */
  tarefasPlanejadas: number | null;
  tarefasExecutadas: number | null;
  /** Valores exibidos: o informado ou, se null, a contagem das atividades. */
  planejadas: number;
  executadas: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface SprintRequest {
  nome: string;
  dataInicio: string | null;
  dataFim: string | null;
  objetivo: string | null;
  status: StatusSprint;
  tarefasPlanejadas: number | null;
  tarefasExecutadas: number | null;
}

export interface Fluxo {
  id: string;
  projetoId: string;
  seq: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  status: StatusFluxo;
  dataAtualizacao: string | null;
  passos: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FluxoRequest {
  seq: number | null;
  codigo: string;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  status: StatusFluxo;
  dataAtualizacao: string | null;
  passos: string | null;
}

export interface Pendencia {
  id: string;
  projetoId: string;
  codigo: string;
  tema: string;
  pergunta: string | null;
  responsavel: string | null;
  /** yyyy-MM-dd */
  prazo: string | null;
  status: StatusPendencia;
  impacto: Nivel | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PendenciaRequest {
  codigo: string;
  tema: string;
  pergunta: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: StatusPendencia;
  impacto: Nivel | null;
}

export interface Risco {
  id: string;
  projetoId: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  impacto: Nivel | null;
  probabilidade: Nivel | null;
  mitigacao: string | null;
  responsavel: string | null;
  status: StatusRisco;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ImpactoCronograma {
  id: string;
  projetoId: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoImpacto;
  tarefasAfetadas: string | null;
  acaoCliente: string | null;
  pendenciaId: string | null;
  pendenciaCodigo: string | null;
  pendenciaTema: string | null;
  impacto: Nivel | null;
  status: StatusImpacto;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ImpactoRequest {
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoImpacto;
  tarefasAfetadas: string | null;
  acaoCliente: string | null;
  pendenciaId: string | null;
  impacto: Nivel | null;
  status: StatusImpacto;
}

export interface RiscoRequest {
  codigo: string;
  titulo: string;
  descricao: string | null;
  impacto: Nivel | null;
  probabilidade: Nivel | null;
  mitigacao: string | null;
  responsavel: string | null;
  status: StatusRisco;
}

/** Tudo o que o portal exibe sobre um projeto (`GET /api/projetos/{id}/painel`). */
export interface Painel {
  projeto: Projeto;
  /** Ordenadas pela data de início. */
  sprints: Sprint[];
  atividades: Atividade[];
  pendencias: Pendencia[];
  riscos: Risco[];
  /** Sem os impactos cancelados. */
  impactos: ImpactoCronograma[];
  /** Sem os fluxos inativos. */
  fluxos: Fluxo[];
}

export type PerfilUsuario = 'ADMIN' | 'USUARIO';

export const PERFIS_USUARIO: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: 'USUARIO', rotulo: 'Usuário' },
  { valor: 'ADMIN', rotulo: 'Administrador' },
];

export interface Usuario {
  id: string;
  login: string;
  nome: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  /** Vazio para ADMIN, que acessa todos os projetos. */
  projetos: { id: string; codigo: string; nome: string }[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioRequest {
  login: string;
  nome: string;
  /** Obrigatória na criação; na edição, null mantém a senha atual. */
  senha: string | null;
  perfil: PerfilUsuario;
  ativo: boolean;
  /** Ignorado para ADMIN; ao menos um para USUARIO. */
  projetoIds: string[];
}

export interface ResultadoImportacao {
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  avisos: string[];
}

/** Corpo de erro da API (RFC 7807). */
export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  erros?: Record<string, string>;
}
