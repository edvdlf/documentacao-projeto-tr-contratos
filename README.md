# Portal de Projetos VetorIT · Gestão de Contratos

Portal de Projetos VetorIT de acompanhamento do projeto **Sistema de Gestão de Contratos**, desenvolvido pela VetorIT para a **Thomson Reuters**.

Alimentado pela planilha Sprint Review · Controle de Entregas.

## Fonte única de dados

Arquivo: `conteudo/Sprint_Review_Controle_Entregas.xlsx`

Não há `projeto.json`. O Angular publica a planilha em `data/` a partir de `conteudo/` (veja `angular.json`).

Abas usadas:

| Aba | Tela |
|-----|------|
| Resumo da Sprint | Dashboard / Resumo |
| Funcionalidades Entregues | Desenvolvidas |
| Próxima Sprint | Próxima Sprint |
| Pendências e Decisões | Pendências |
| Riscos | Riscos |
| Evolução do Projeto | Resumo (gráfico + evolução por sprint) |
| Fluxos Bizagi | Fluxos Bizagi |

### Aba Fluxos Bizagi

Colunas: **Seq** · ID · Nome · Descrição · Imagem · **Status** · AtualizadoEm

- Altere os **números da coluna Seq** (1, 2, 3…) para mudar a ordem das abas
- Só rearranjar as linhas sem mudar o Seq **não** altera a ordem no site
- `Status` = `Ativo` | `Inativo` | `Oculto` (oculto não aparece)
- `Imagem` = arquivo em `public/fluxos/` (ex.: `ausencia-de-consumo.png`)
- **Salve o arquivo** em `conteudo/Sprint_Review_Controle_Entregas.xlsx` (não em Downloads/Desktop)

## Atualizar conteúdo

1. Edite e **salve** `conteudo/Sprint_Review_Controle_Entregas.xlsx`
2. Reinicie `npm start` (ou `npm run build`) para republicar o asset
3. No browser: Ctrl+F5

## Local

```bash
npm install
npm start
```
