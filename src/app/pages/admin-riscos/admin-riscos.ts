import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Listagem,
  NIVEIS,
  Nivel,
  Pagina,
  Projeto,
  Risco,
  RiscoRequest,
  STATUS_RISCO,
  StatusRisco,
  rotuloNivel,
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
  { valor: 'codigo', rotulo: 'ID' },
  { valor: 'titulo', rotulo: 'Risco' },
  { valor: 'impacto', rotulo: 'Impacto' },
  { valor: 'probabilidade', rotulo: 'Probabilidade' },
  { valor: 'responsavel', rotulo: 'Responsável' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

interface FormularioRisco {
  codigo: string;
  titulo: string;
  descricao: string;
  impacto: string;
  probabilidade: string;
  mitigacao: string;
  responsavel: string;
  status: StatusRisco;
}

function formularioVazio(): FormularioRisco {
  return {
    codigo: '',
    titulo: '',
    descricao: '',
    impacto: '',
    probabilidade: '',
    mitigacao: '',
    responsavel: '',
    status: 'ABERTO',
  };
}

function nivelOuNulo(valor: string): Nivel | null {
  return (textoOuNulo(valor) as Nivel | null) ?? null;
}

@Component({
  selector: 'app-admin-riscos',
  imports: [FormsModule, SeletorProjetoComponent, ImportarPlanilhaComponent],
  templateUrl: './admin-riscos.html',
})
export class AdminRiscosComponent {
  private readonly api = inject(AdminApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_RISCO;
  readonly niveis = NIVEIS;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly rotuloNivel = rotuloNivel;
  readonly tomStatus = tomStatus;

  readonly projetoAtual = signal<Projeto | null>(null);
  filtros: { q: string; status: StatusRisco | '' } = { q: '', status: '' };
  readonly listagem = signal<Listagem>({ page: 0, size: 50, sort: 'codigo', direction: 'ASC' });
  readonly pagina = signal<Pagina<Risco> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly importar = (arquivo: File) => this.api.importarRiscos(this.projetoAtual()!.id, arquivo);

  readonly emEdicao = signal<Risco | 'novo' | null>(null);
  form: FormularioRisco = formularioVazio();
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
    this.api.listarRiscos(projeto.id, this.filtros, this.listagem()).subscribe({
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

  novo(): void {
    this.form = formularioVazio();
    this.abrirFormulario('novo');
  }

  editar(r: Risco): void {
    this.form = {
      codigo: r.codigo,
      titulo: r.titulo,
      descricao: r.descricao ?? '',
      impacto: r.impacto ?? '',
      probabilidade: r.probabilidade ?? '',
      mitigacao: r.mitigacao ?? '',
      responsavel: r.responsavel ?? '',
      status: r.status,
    };
    this.abrirFormulario(r);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const req: RiscoRequest = {
      codigo: this.form.codigo.trim(),
      titulo: this.form.titulo.trim(),
      descricao: textoOuNulo(this.form.descricao),
      impacto: nivelOuNulo(this.form.impacto),
      probabilidade: nivelOuNulo(this.form.probabilidade),
      mitigacao: textoOuNulo(this.form.mitigacao),
      responsavel: textoOuNulo(this.form.responsavel),
      status: this.form.status,
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'novo'
        ? this.api.criarRisco(projeto.id, req)
        : this.api.atualizarRisco(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Risco ${salvo.codigo} ${alvo === 'novo' ? 'criado' : 'atualizado'} com sucesso.`,
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

  alterarStatus(r: Risco, status: StatusRisco): void {
    this.aviso.set(null);
    this.api.alterarStatusRisco(r.projetoId, r.id, status).subscribe({
      next: (atualizado) => {
        this.pagina.update((p) =>
          p
            ? { ...p, content: p.content.map((x) => (x.id === atualizado.id ? atualizado : x)) }
            : p,
        );
        this.aviso.set(`Status do risco ${r.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(r: Risco): void {
    if (!confirm(`Excluir o risco ${r.codigo} - ${r.titulo}?`)) return;
    this.aviso.set(null);
    this.api.excluirRisco(r.projetoId, r.id).subscribe({
      next: () => {
        this.aviso.set(`Risco ${r.codigo} excluído.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'novo' && atual.id === r.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Risco | 'novo'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
