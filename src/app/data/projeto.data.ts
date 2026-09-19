/**
 * Fallback mínimo (só se a planilha falhar ao carregar).
 * Conteúdo real: conteudo/Sprint_Review_Controle_Entregas.xlsx
 */
import { ProjetoConteudo } from '../models/projeto.models';

export const CONTEUDO_FALLBACK: ProjetoConteudo = {
  resumo: {
    titulo: 'RESUMO GERAL DAS SPRINTS — SISTEMA DE GESTÃO DE CONTRATOS',
    subtitulo: 'Visão executiva das sprints do projeto',
    totais: {
      sprintsNoResumo: 0,
      itensPlanejados: 0,
      itensEntregues: 0,
      aderencia: '0%',
    },
    desempenho: [],
    observacao: '',
  },
  entregues: [],
  proximaSprint: [],
  pendencias: [],
  evolucao: [],
  riscos: [],
  fluxos: [],
};
