import * as XLSX from 'xlsx';
import {
  EvolucaoSprint,
  FluxoBizagi,
  ItemEntrega,
  Pendencia,
  ProjetoConteudo,
  ResumoSprint,
  Risco,
} from '../models/projeto.models';

type SheetMatrix = string[][];

function matrix(workbook: XLSX.WorkBook, sheetName: string): SheetMatrix {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Aba não encontrada: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1, raw: false }) as SheetMatrix;
}

function optionalMatrix(workbook: XLSX.WorkBook, sheetName: string): SheetMatrix | null {
  if (!workbook.Sheets[sheetName]) return null;
  return matrix(workbook, sheetName);
}

function cell(row: string[] | undefined, index: number): string {
  return String(row?.[index] ?? '').trim();
}

function toNumber(value: string): number {
  const n = Number(String(value).replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
}

/** Aceita número, texto ("1") ou valor serial do Excel. */
function parseSeq(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const asText = String(value ?? '')
    .trim()
    .replace('%', '')
    .replace(',', '.');
  if (!asText) return fallback;
  const n = Number(asText);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function findHeaderRow(rows: SheetMatrix, required: string[]): number {
  const wanted = required.map((h) => h.toLowerCase());
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cells = (rows[i] ?? []).map((c) => String(c ?? '').trim().toLowerCase());
    if (wanted.every((h) => cells.some((c) => c === h || c.startsWith(h)))) {
      return i;
    }
  }
  return -1;
}

function colIndex(header: string[], ...names: string[]): number {
  const lowered = header.map((h) => h.toLowerCase());
  for (const name of names) {
    const idx = lowered.findIndex((h) => h === name || h.startsWith(name));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseResumo(rows: SheetMatrix): ResumoSprint {
  const desempenho = [];
  for (let i = 11; i < rows.length; i++) {
    const sprint = cell(rows[i], 0);
    if (!sprint.startsWith('Sprint')) break;
    desempenho.push({
      sprint,
      planejados: toNumber(cell(rows[i], 1)),
      concluidos: toNumber(cell(rows[i], 2)),
      percentual: cell(rows[i], 3),
      status: cell(rows[i], 4),
      periodo: cell(rows[i], 5) || sprint.replace(/^Sprint\s*\d+\s*-\s*/i, ''),
    });
  }

  const observacao =
    rows
      .slice(17, 21)
      .map((r) => cell(r, 0))
      .find((t) => t && !t.toUpperCase().includes('OBSERVAÇÃO')) ?? '';

  return {
    titulo: cell(rows[0], 0) || 'Resumo das Sprints',
    subtitulo: cell(rows[2], 0),
    totais: {
      sprintsNoResumo: toNumber(cell(rows[5], 0)),
      itensPlanejados: toNumber(cell(rows[5], 3)),
      itensEntregues: toNumber(cell(rows[5], 6)),
      aderencia: cell(rows[5], 8) || '0%',
    },
    desempenho,
    observacao,
  };
}

function parseItens(rows: SheetMatrix, headerIndex: number): ItemEntrega[] {
  const itens: ItemEntrega[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const sprint = cell(rows[i], 0);
    const id = cell(rows[i], 1);
    const funcionalidade = cell(rows[i], 2);
    if (!id && !funcionalidade) {
      if (!sprint) break;
      continue;
    }
    itens.push({
      sprint,
      id,
      funcionalidade,
      descricao: cell(rows[i], 3),
      responsavel: cell(rows[i], 4),
      status: cell(rows[i], 5),
      observacoes: cell(rows[i], 6),
    });
  }
  return itens;
}

function parsePendencias(rows: SheetMatrix): Pendencia[] {
  const itens: Pendencia[] = [];
  for (let i = 4; i < rows.length; i++) {
    const id = cell(rows[i], 0);
    const tema = cell(rows[i], 1);
    if (!id && !tema) break;
    itens.push({
      id,
      tema,
      pergunta: cell(rows[i], 2),
      responsavel: cell(rows[i], 3),
      prazo: cell(rows[i], 4),
      status: cell(rows[i], 5),
      impacto: cell(rows[i], 6),
    });
  }
  return itens;
}

function parseEvolucao(rows: SheetMatrix): EvolucaoSprint[] {
  const itens: EvolucaoSprint[] = [];
  for (let i = 4; i < rows.length; i++) {
    const sprint = cell(rows[i], 0);
    if (!sprint.startsWith('Sprint')) break;
    const entreguesRaw = cell(rows[i], 2);
    itens.push({
      sprint,
      planejadas: toNumber(cell(rows[i], 1)),
      entregues: entreguesRaw === '' ? null : toNumber(entreguesRaw),
      acumuladas: toNumber(cell(rows[i], 3)),
    });
  }
  return itens;
}

function parseRiscos(rows: SheetMatrix): Risco[] {
  const itens: Risco[] = [];
  for (let i = 4; i < rows.length; i++) {
    const id = cell(rows[i], 0);
    const risco = cell(rows[i], 1);
    if (!id && !risco) break;
    itens.push({
      id,
      risco,
      descricao: cell(rows[i], 2),
      impacto: cell(rows[i], 3),
      probabilidade: cell(rows[i], 4),
      mitigacao: cell(rows[i], 5),
      responsavel: cell(rows[i], 6),
      status: cell(rows[i], 7),
    });
  }
  return itens;
}

function normalizarImagem(valor: string, id: string): string {
  const raw = valor || `${id}.png`;
  if (raw.startsWith('/') || raw.startsWith('http')) return raw;
  return `/fluxos/${raw.replace(/^fluxos\//i, '')}`;
}

function parsePassos(valor: string): string[] {
  const raw = valor.trim().replace(/\\n/g, '\n');
  if (!raw) return [];

  const partes = /[\r\n]/.test(raw) ? raw.split(/\r?\n/) : raw.split('|');
  const isEstruturado =
    /feature\s*:|scenario\s*:|\b(given|when|then)\b|caso de uso\s*:|objetivo|gatilho|fluxo principal/i.test(
      raw,
    );

  if (isEstruturado) {
    // Preserva linhas em branco e numeração do descritivo estruturado
    return partes.map((p) => p.replace(/\s+$/, ''));
  }

  return partes
    .map((p) => p.replace(/^\s*\d+[\).:\-]\s*/, '').trim())
    .filter(Boolean);
}

function statusVisivel(status: string): boolean {
  const s = status.trim().toLowerCase();
  if (!s) return true;
  // Oculto some da UI; Inativo continua listado (com status visível)
  return !['oculto', 'desativado', 'escondido'].includes(s);
}

function parseFluxos(rows: SheetMatrix): FluxoBizagi[] {
  const headerIndex = findHeaderRow(rows, ['seq', 'id', 'nome']);
  if (headerIndex < 0) return [];

  const header = (rows[headerIndex] ?? []).map((c) => String(c ?? '').trim());
  const iSeq = colIndex(header, 'seq', 'sequencia', 'sequência', 'ordem');
  const iId = colIndex(header, 'id');
  const iNome = colIndex(header, 'nome', 'fluxo');
  const iDesc = colIndex(header, 'descrição', 'descricao', 'descriçao');
  const iImg = colIndex(header, 'imagem', 'arquivo', 'png');
  const iStatus = colIndex(header, 'status', 'situação', 'situacao');
  const iAtualizado = colIndex(header, 'atualizadoem', 'atualizado em', 'atualizado');
  const iPassos = colIndex(
    header,
    'passo a passo',
    'passos',
    'passoapasso',
    'descritivo',
    'etapas',
  );

  if (iSeq < 0 || iId < 0 || iNome < 0) return [];

  const itens: FluxoBizagi[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const id = cell(row, iId);
    const nome = cell(row, iNome);
    if (!id && !nome) break;

    const status = (iStatus >= 0 ? cell(row, iStatus) : '') || 'Ativo';
    if (!statusVisivel(status)) continue;

    const seq = parseSeq(row?.[iSeq], i - headerIndex);
    itens.push({
      seq,
      id: id || nome.toLowerCase().replace(/\s+/g, '-'),
      nome,
      descricao: iDesc >= 0 ? cell(row, iDesc) : '',
      imagem: normalizarImagem(iImg >= 0 ? cell(row, iImg) : '', id),
      status,
      atualizadoEm: iAtualizado >= 0 ? cell(row, iAtualizado) : '',
      passos: iPassos >= 0 ? parsePassos(cell(row, iPassos)) : [],
    });
  }

  return itens.sort((a, b) => a.seq - b.seq || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function sheetFluxos(workbook: XLSX.WorkBook): SheetMatrix | null {
  const names = ['Fluxos Bizagi', 'Fluxos', 'Fluxo Bizagi'];
  for (const name of names) {
    const rows = optionalMatrix(workbook, name);
    if (rows) return rows;
  }
  // fallback: qualquer aba que contenha "fluxo"
  const found = workbook.SheetNames.find((n) => /fluxo/i.test(n));
  return found ? matrix(workbook, found) : null;
}

export function parseProjetoWorkbook(data: ArrayBuffer): ProjetoConteudo {
  const workbook = XLSX.read(data, { type: 'array', cellDates: false });
  const riscosRows = optionalMatrix(workbook, 'Riscos');
  const fluxosRows = sheetFluxos(workbook);
  const fluxosDaPlanilha = fluxosRows ? parseFluxos(fluxosRows) : [];

  return {
    fonte: 'conteudo/Sprint_Review_Controle_Entregas.xlsx',
    geradoEm: new Date().toISOString(),
    resumo: parseResumo(matrix(workbook, 'Resumo da Sprint')),
    entregues: parseItens(matrix(workbook, 'Funcionalidades Entregues'), 3),
    proximaSprint: parseItens(matrix(workbook, 'Próxima Sprint'), 3),
    pendencias: parsePendencias(matrix(workbook, 'Pendências e Decisões')),
    evolucao: parseEvolucao(matrix(workbook, 'Evolução do Projeto')),
    riscos: riscosRows ? parseRiscos(riscosRows) : [],
    fluxos: fluxosDaPlanilha,
  };
}
