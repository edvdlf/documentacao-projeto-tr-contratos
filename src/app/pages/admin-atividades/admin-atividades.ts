import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Atividade,
  AtividadeRequest,
  Listagem,
  Pagina,
  Projeto,
  STATUS_ATIVIDADE,
  Sprint,
  StatusAtividade,
  rotuloStatus,
  tomStatus,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
  textoOuNulo,
} from '../../services/admin-api.service';
import { ImportarPlanilhaComponent } from '../admin-shared/importar-planilha';
import { SeletorProjetoComponent } from '../admin-shared/seletor-projeto';

const ORDENACOES = [
  { valor: 'sprint', rotulo: 'Sprint' },
  { valor: 'codigo', rotulo: 'Código' },
  { valor: 'titulo', rotulo: 'Título' },
  { valor: 'responsavel', rotulo: 'Responsável' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

function formularioVazio(): AtividadeRequest {
  return {
    codigo: '',
    sprint: '',
    titulo: '',
    descricao: '',
    responsavel: '',
    status: 'PLANEJADA',
    observacoes: '',
  };
}

@Component({
  selector: 'app-admin-atividades',
  imports: [FormsModule, SeletorProjetoComponent, ImportarPlanilhaComponent],
  templateUrl: './admin-atividades.html',
})
export class AdminAtividadesComponent {
  private readonly api = inject(AdminApiService);

  /** Query params `?projeto=<id>&sprint=<nome>` (withComponentInputBinding). */
  readonly projeto = input<string>();
  readonly sprint = input<string>();

  readonly statusOpcoes = STATUS_ATIVIDADE;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly tomStatus = tomStatus;

  readonly projetoAtual = signal<Projeto | null>(null);
  readonly sprints = signal<Sprint[]>([]);
  filtros: { sprint: string; status: StatusAtividade | '' } = { sprint: '', status: '' };
  readonly listagem = signal<Listagem>({ page: 0, size: 50, sort: 'sprint', direction: 'ASC' });
  readonly pagina = signal<Pagina<Atividade> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly importar = (arquivo: File) =>
    this.api.importarAtividades(this.projetoAtual()!.id, arquivo);

  readonly emEdicao = signal<Atividade | 'nova' | null>(null);
  form: AtividadeRequest = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  aoSelecionarProjeto(projeto: Projeto | null): void {
    this.projetoAtual.set(projeto);
    this.emEdicao.set(null);
    this.aviso.set(null);
    this.pagina.set(null);
    this.sprints.set([]);
    this.filtros = { sprint: this.sprint() ?? '', status: '' };
    if (!projeto) return;
    this.listagem.update((l) => ({ ...l, page: 0 }));
    this.carregar();
    this.api
      .listarSprints(projeto.id, { q: '', status: '' }, {
        page: 0,
        size: 200,
        sort: 'dataInicio',
        direction: 'ASC',
      })
      .subscribe({ next: (p) => this.sprints.set(p.content), error: () => this.sprints.set([]) });
  }

  carregar(): void {
    const projeto = this.projetoAtual();
    if (!projeto) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarAtividades(projeto.id, this.filtros, this.listagem()).subscribe({
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

  limparFiltros(): void {
    this.filtros = { sprint: '', status: '' };
    this.filtrar();
  }

  alterarListagem(parcial: Partial<Listagem>): void {
    this.listagem.update((l) => ({ ...l, page: 0, ...parcial }));
    this.carregar();
  }

  irParaPagina(page: number): void {
    this.listagem.update((l) => ({ ...l, page }));
    this.carregar();
  }

  nova(): void {
    this.form = formularioVazio();
    this.abrirFormulario('nova');
  }

  editar(a: Atividade): void {
    this.form = {
      codigo: a.codigo,
      sprint: a.sprint ?? '',
      titulo: a.titulo,
      descricao: a.descricao ?? '',
      responsavel: a.responsavel ?? '',
      status: a.status,
      observacoes: a.observacoes ?? '',
    };
    this.abrirFormulario(a);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const req: AtividadeRequest = {
      codigo: this.form.codigo.trim(),
      sprint: textoOuNulo(this.form.sprint),
      titulo: this.form.titulo.trim(),
      descricao: textoOuNulo(this.form.descricao),
      responsavel: textoOuNulo(this.form.responsavel),
      status: this.form.status,
      observacoes: textoOuNulo(this.form.observacoes),
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'nova'
        ? this.api.criarAtividade(projeto.id, req)
        : this.api.atualizarAtividade(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salva) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Atividade ${salva.codigo} ${alvo === 'nova' ? 'criada' : 'atualizada'} com sucesso.`,
        );
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.errosForm.set(errosDeCampo(e));
        this.erroForm.set(mensagemErro(e));
      },
    });
  }

  alterarStatus(a: Atividade, status: StatusAtividade): void {
    this.aviso.set(null);
    this.api.alterarStatusAtividade(a.projetoId, a.id, status).subscribe({
      next: (atualizada) => {
        this.pagina.update((p) =>
          p
            ? { ...p, content: p.content.map((x) => (x.id === atualizada.id ? atualizada : x)) }
            : p,
        );
        this.aviso.set(`Status da atividade ${a.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(a: Atividade): void {
    if (!confirm(`Excluir a atividade ${a.codigo} - ${a.titulo}?`)) return;
    this.aviso.set(null);
    this.api.excluirAtividade(a.projetoId, a.id).subscribe({
      next: () => {
        this.aviso.set(`Atividade ${a.codigo} excluída.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'nova' && atual.id === a.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Atividade | 'nova'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
