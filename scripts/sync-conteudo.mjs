/**
 * Valida a planilha oficial em conteudo/.
 * O Angular copia esse arquivo para data/ via angular.json (assets).
 *
 * Uso: node scripts/sync-conteudo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const excelPath = path.join(root, 'conteudo', 'Sprint_Review_Controle_Entregas.xlsx');
const legacyJson = path.join(root, 'public', 'data', 'projeto.json');
const legacyPublicXlsx = path.join(
  root,
  'public',
  'data',
  'Sprint_Review_Controle_Entregas.xlsx',
);

if (!fs.existsSync(excelPath)) {
  console.error(`Planilha não encontrada:\n  ${excelPath}`);
  console.error('Salve/edite o arquivo em conteudo/Sprint_Review_Controle_Entregas.xlsx');
  process.exit(1);
}

if (fs.existsSync(legacyJson)) {
  fs.unlinkSync(legacyJson);
  console.log('Removido legado: public/data/projeto.json');
}

// Evita cópia antiga em public/data competir com o asset de conteudo/
if (fs.existsSync(legacyPublicXlsx)) {
  fs.unlinkSync(legacyPublicXlsx);
  console.log('Removido legado: public/data/Sprint_Review_Controle_Entregas.xlsx');
}

const st = fs.statSync(excelPath);
console.log(`Fonte OK: ${path.relative(root, excelPath)}`);
console.log(`  atualizado em ${st.mtime.toISOString()}`);
console.log('O site usa este arquivo via angular.json → data/ (sem JSON).');
