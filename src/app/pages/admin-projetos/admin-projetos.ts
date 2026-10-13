import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  dataBr,
  Listagem,
  Pagina,
  Projeto,
  ProjetoRequest,
  STATUS_PROJETO,
  StatusProjeto,
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

const ORDENACOES = [
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'codigo', rotulo: 'Código' },
  { valor: 'cliente', rotulo: 'Cliente' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'dataInicio', rotulo: 'Data início' },
  { valor: 'dataFim', rotulo: 'Data fim' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

function formularioVazio(): ProjetoRequest {
  return {
    codigo: '',
    nome: '',
    nomeCurto: '',
    cliente: '',
    descricao: '',
    status: 'PLANEJADO',
    dataInicio: '',
    dataFim: '',
  };
}

@Component({
  selector: 'app-admin-projetos',
  imports: [FormsModule, RouterLink, ImportarPlanilhaComponent],
  templateUrl: './admin-projetos.html',
})
export class AdminProjetosComponent {
  private readonly api = inject(AdminApiService);

  readonly statusOpcoes = STATUS_PROJETO;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly tomStatus = tomStatus;
  readonly dataBr = dataBr;

  q = '';
  readonly listagem = signal<Listagem>({ page: 0, size: 20, sort: 'nome', direction: 'ASC' });
  readonly pagina = signal<Pagina<Projeto> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly baixandoTemplate = signal(false);
  readonly importar = (arquivo: File) => this.api.importarProjetos(arquivo);

  /** `null` = formulário fechado; `'novo'` = criação; projeto = edição. */
  readonly emEdicao = signal<Projeto | 'novo' | null>(null);
  form: ProjetoRequest = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarProjetos(this.q, this.listagem()).subscribe({
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

  buscar(): void {
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
    this.baixandoTemplate.set(true);
    this.api.baixarTemplateProjetos().subscribe({
      next: (blob) => {
        salvarArquivo(blob, 'template-importacao-projetos.xlsx');
        this.baixandoTemplate.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.baixandoTemplate.set(false);
      },
    });
  }

  novo(): void {
    this.form = formularioVazio();
    this.abrirFormulario('novo');
  }

  editar(p: Projeto): void {
    this.form = {
      codigo: p.codigo,
      nome: p.nome,
      nomeCurto: p.nomeCurto ?? '',
      cliente: p.cliente ?? '',
      descricao: p.descricao ?? '',
      status: p.status,
      dataInicio: p.dataInicio ?? '',
      dataFim: p.dataFim ?? '',
    };
    this.abrirFormulario(p);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    if (!alvo) return;

    const req: ProjetoRequest = {
      codigo: this.form.codigo.trim(),
      nome: this.form.nome.trim(),
      nomeCurto: textoOuNulo(this.form.nomeCurto),
      cliente: textoOuNulo(this.form.cliente),
      descricao: textoOuNulo(this.form.descricao),
      status: this.form.status,
      dataInicio: textoOuNulo(this.form.dataInicio),
      dataFim: textoOuNulo(this.form.dataFim),
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'novo' ? this.api.criarProjeto(req) : this.api.atualizarProjeto(alvo.id, req);

    chamada.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Projeto ${salvo.codigo} ${alvo === 'novo' ? 'criado' : 'atualizado'} com sucesso.`,
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

  alterarStatus(p: Projeto, status: StatusProjeto): void {
    this.aviso.set(null);
    this.api.alterarStatusProjeto(p.id, status).subscribe({
      next: (atualizado) => {
        this.pagina.update((pg) =>
          pg
            ? { ...pg, content: pg.content.map((x) => (x.id === atualizado.id ? atualizado : x)) }
            : pg,
        );
        this.aviso.set(`Status do projeto ${p.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(p: Projeto): void {
    if (!confirm(`Excluir o projeto ${p.codigo} - ${p.nome}?`)) return;
    this.aviso.set(null);
    this.api.excluirProjeto(p.id).subscribe({
      next: () => {
        this.aviso.set(`Projeto ${p.codigo} excluído.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'novo' && atual.id === p.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Projeto | 'novo'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
