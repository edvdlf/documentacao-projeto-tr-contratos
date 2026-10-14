import { Projeto } from '../models/admin.models';

/** Menus opcionais do portal, configurados por projeto (provisório até virem da API). */
export interface RecursosProjeto {
  bizagi: boolean;
  /**
   * `painelRetificacoes`: mostra o painel do portal, alimentado pela planilha enviada à API;
   * sem ele, incorpora o relatório (`url`).
   */
  powerBi: { titulo: string; url: string; painelRetificacoes?: boolean } | null;
}

const PADRAO: RecursosProjeto = { bizagi: true, powerBi: null };

/** `identificadores`: código ou nome do projeto (sem diferenciar maiúsculas e acentos). */
const POR_PROJETO: { identificadores: string[]; recursos: RecursosProjeto }[] = [
  {
    identificadores: ['0002-DPSP -Retificação - ROT - RJ', 'Retificação do Ressarcimento ICMS-ST - RJ'],
    recursos: {
      bizagi: false,
      powerBi: {
        titulo: 'Painel Retificação ROT - RJ - DPSP',
        url:
          'https://app.powerbi.com/reportEmbed?reportId=a4ff6bb7-a6c9-468e-bd06-54064e35efac' +
          '&autoAuth=true&ctid=9e9a1ffb-eecd-4879-acac-b09c44800e08',
        painelRetificacoes: true,
      },
    },
  },
];

export function recursosDoProjeto(projeto: Projeto | null): RecursosProjeto {
  if (!projeto) return PADRAO;
  const chaves = [projeto.codigo, projeto.nome].map(normalizar);
  const config = POR_PROJETO.find((c) =>
    c.identificadores.some((id) => chaves.includes(normalizar(id))),
  );
  return config?.recursos ?? PADRAO;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
