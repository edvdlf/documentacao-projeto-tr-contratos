import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  dataBr,
  Listagem,
  Pagina,
  Projeto,
  STATUS_SPRINT,
  Sprint,
  SprintRequest,
  StatusSprint,
  rotuloStatus,
  tomStatus,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
  salvarArquivo,
  textoOuNulo,
} from '../../services/admin-api.service';
import { ImportarPlanilhaComponent } from '../admin-shared/importar-planilha';
import { SeletorProjetoComponent } from '../admin-shared/seletor-projeto';

const ORDENACOES = [
  { valor: 'dataInicio', rotulo: 'Data início' },
  { valor: 'dataFim', rotulo: 'Data fim' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

function formularioVazio(): SprintRequest {
  return {
    nome: '',
    dataInicio: '',
    dataFim: '',
    objetivo: '',
    status: 'PLANEJADA',
    tarefasPlanejadas: null,
    tarefasExecutadas: null,
  };
}

/** Campo numérico vazio vira null (o portal passa a usar a contagem das atividades). */
function quantidadeOuNula(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

@Component({
  selector: 'app-admin-sprints',
  imports: [FormsModule, RouterLink, SeletorProjetoComponent, ImportarPlanilhaComponent],
  templateUrl: './admin-sprints.html',
})
export class AdminSprintsComponent {
  private readonly api = inject(AdminApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_SPRINT;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly tomStatus = tomStatus;
  readonly dataBr = dataBr;

  readonly projetoAtual = signal<Projeto | null>(null);
  filtros: { q: string; status: StatusSprint | '' } = { q: '', status: '' };
  readonly listagem = signal<Listagem>({
    page: 0,
    size: 50,
    sort: 'dataInicio',
    direction: 'ASC',
  });
  readonly pagina = signal<Pagina<Sprint> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly baixandoTemplate = signal(false);
  readonly importar = (arquivo: File) => this.api.importarSprints(this.projetoAtual()!.id, arquivo);

  readonly emEdicao = signal<Sprint | 'nova' | null>(null);
  form: SprintRequest = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  aoSelecionarProjeto(projeto: Projeto | null): void {
    this.projetoAtual.set(projeto);
    this.emEdicao.set(null);
    this.aviso.set(null);
    this.pagina.set(null);
    if (!projeto) return;
    this.listagem.update((l) => ({ ...l, page: 0 }));
    this.carregar();
  }

  carregar(): void {
    const projeto = this.projetoAtual();
    if (!projeto) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarSprints(projeto.id, this.filtros, this.listagem()).subscribe({
      next: (p) => {
        this.pagina.set(p);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      },
    });
  }

  filtrar(): void {
    this.listagem.update((l) => ({ ...l, page: 0 }));
    this.carregar();
  }

  alterarListagem(parcial: Partial<Listagem>): void {
    this.listagem.update((l) => ({ ...l, page: 0, ...parcial }));
    this.carregar();
  }

  irParaPagina(page: number): void {
    this.listagem.update((l) => ({ ...l, page }));
    this.carregar();
  }

  baixarTemplate(): void {
    const projeto = this.projetoAtual();
    if (!projeto) return;
    this.baixandoTemplate.set(true);
    this.api.baixarTemplateSprints(projeto.id).subscribe({
      next: (blob) => {
        salvarArquivo(blob, 'template-importacao-sprints.xlsx');
        this.baixandoTemplate.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.baixandoTemplate.set(false);
      },
    });
  }

  nova(): void {
    this.form = formularioVazio();
    this.abrirFormulario('nova');
  }

  editar(s: Sprint): void {
    this.form = {
      nome: s.nome,
      dataInicio: s.dataInicio ?? '',
      dataFim: s.dataFim ?? '',
      objetivo: s.objetivo ?? '',
      status: s.status,
      tarefasPlanejadas: s.tarefasPlanejadas,
      tarefasExecutadas: s.tarefasExecutadas,
    };
    this.abrirFormulario(s);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  /** Dica do campo vazio: o valor que o portal usará pela contagem das atividades. */
  contagemPlanejadas(): string {
    const alvo = this.emEdicao();
    return alvo && alvo !== 'nova' ? `Contagem: ${alvo.totalAtividades}` : 'Contagem das atividades';
  }

  contagemExecutadas(): string {
    const alvo = this.emEdicao();
    return alvo && alvo !== 'nova'
      ? `Contagem: ${alvo.atividadesConcluidas}`
      : 'Contagem das atividades';
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const req: SprintRequest = {
      nome: this.form.nome.trim(),
      dataInicio: textoOuNulo(this.form.dataInicio),
      dataFim: textoOuNulo(this.form.dataFim),
      objetivo: textoOuNulo(this.form.objetivo),
      status: this.form.status,
      tarefasPlanejadas: quantidadeOuNula(this.form.tarefasPlanejadas),
      tarefasExecutadas: quantidadeOuNula(this.form.tarefasExecutadas),
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'nova'
        ? this.api.criarSprint(projeto.id, req)
        : this.api.atualizarSprint(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salva) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(`${salva.nome} ${alvo === 'nova' ? 'criada' : 'atualizada'} com sucesso.`);
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.errosForm.set(errosDeCampo(e));
        this.erroForm.set(mensagemErro(e));
      },
    });
  }

  alterarStatus(s: Sprint, status: StatusSprint): void {
    this.aviso.set(null);
    this.api.alterarStatusSprint(s.projetoId, s.id, status).subscribe({
      next: (atualizada) => {
        this.pagina.update((p) =>
          p
            ? { ...p, content: p.content.map((x) => (x.id === atualizada.id ? atualizada : x)) }
            : p,
        );
        this.aviso.set(`Status da ${s.nome} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(s: Sprint): void {
    const extra = s.totalAtividades
      ? ` As ${s.totalAtividades} atividade(s) dela continuam cadastradas.`
      : '';
    if (!confirm(`Excluir a ${s.nome}?${extra}`)) return;
    this.aviso.set(null);
    this.api.excluirSprint(s.projetoId, s.id).subscribe({
      next: () => {
        this.aviso.set(`${s.nome} excluída.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'nova' && atual.id === s.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Sprint | 'nova'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
