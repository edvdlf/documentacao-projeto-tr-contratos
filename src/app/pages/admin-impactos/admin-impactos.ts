import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ImpactoCronograma,
  ImpactoRequest,
  Listagem,
  NIVEIS,
  Pagina,
  Pendencia,
  Projeto,
  STATUS_IMPACTO,
  STATUS_PENDENCIA,
  StatusImpacto,
  TIPOS_IMPACTO,
  TipoImpacto,
  rotuloNivel,
  rotuloStatus,
  rotuloTipoImpacto,
  tomStatus,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
  textoOuNulo,
} from '../../services/admin-api.service';
import { SeletorProjetoComponent } from '../admin-shared/seletor-projeto';

const ORDENACOES = [
  { valor: 'codigo', rotulo: 'ID' },
  { valor: 'titulo', rotulo: 'Título' },
  { valor: 'tipo', rotulo: 'Tipo' },
  { valor: 'impacto', rotulo: 'Impacto' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

interface FormularioImpacto {
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: TipoImpacto;
  tarefasAfetadas: string;
  acaoCliente: string;
  pendenciaId: string;
  status: StatusImpacto;
  impacto: string;
}

function formularioVazio(): FormularioImpacto {
  return {
    codigo: '',
    titulo: '',
    descricao: '',
    tipo: 'BLOQUEIO_INICIO',
    tarefasAfetadas: '',
    acaoCliente: '',
    pendenciaId: '',
    status: 'ATIVO',
    impacto: 'ALTO',
  };
}

@Component({
  selector: 'app-admin-impactos',
  imports: [FormsModule, SeletorProjetoComponent],
  templateUrl: './admin-impactos.html',
})
export class AdminImpactosComponent {
  private readonly api = inject(AdminApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_IMPACTO;
  readonly tipos = TIPOS_IMPACTO;
  readonly niveis = NIVEIS;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly rotuloTipo = rotuloTipoImpacto;
  readonly rotuloNivel = rotuloNivel;
  readonly tomStatus = tomStatus;

  readonly projetoAtual = signal<Projeto | null>(null);
  readonly pendencias = signal<Pendencia[]>([]);
  filtros: { q: string; status: StatusImpacto | '' } = { q: '', status: '' };
  readonly listagem = signal<Listagem>({ page: 0, size: 50, sort: 'codigo', direction: 'ASC' });
  readonly pagina = signal<Pagina<ImpactoCronograma> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly emEdicao = signal<ImpactoCronograma | 'nova' | null>(null);
  form: FormularioImpacto = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  aoSelecionarProjeto(projeto: Projeto | null): void {
    this.projetoAtual.set(projeto);
    this.emEdicao.set(null);
    this.aviso.set(null);
    this.pagina.set(null);
    this.pendencias.set([]);
    if (!projeto) return;
    this.listagem.update((l) => ({ ...l, page: 0 }));
    this.carregarPendencias(projeto.id);
    this.carregar();
  }

  carregar(): void {
    const projeto = this.projetoAtual();
    if (!projeto) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarImpactos(projeto.id, this.filtros, this.listagem()).subscribe({
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

  nova(): void {
    this.form = formularioVazio();
    this.abrirFormulario('nova');
  }

  editar(item: ImpactoCronograma): void {
    this.form = {
      codigo: item.codigo,
      titulo: item.titulo,
      descricao: item.descricao ?? '',
      tipo: item.tipo,
      tarefasAfetadas: item.tarefasAfetadas ?? '',
      acaoCliente: item.acaoCliente ?? '',
      pendenciaId: item.pendenciaId ?? '',
      status: item.status,
      impacto: item.impacto ?? '',
    };
    this.abrirFormulario(item);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const req: ImpactoRequest = {
      codigo: this.form.codigo.trim(),
      titulo: this.form.titulo.trim(),
      descricao: textoOuNulo(this.form.descricao),
      tipo: this.form.tipo,
      tarefasAfetadas: textoOuNulo(this.form.tarefasAfetadas),
      acaoCliente: textoOuNulo(this.form.acaoCliente),
      pendenciaId: textoOuNulo(this.form.pendenciaId),
      impacto: (textoOuNulo(this.form.impacto) as ImpactoRequest['impacto']) ?? null,
      status: this.form.status,
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'nova'
        ? this.api.criarImpacto(projeto.id, req)
        : this.api.atualizarImpacto(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Impacto ${salvo.codigo} ${alvo === 'nova' ? 'criado' : 'atualizado'} com sucesso.`,
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

  alterarStatus(item: ImpactoCronograma, status: StatusImpacto): void {
    this.aviso.set(null);
    this.api.alterarStatusImpacto(item.projetoId, item.id, status).subscribe({
      next: (atualizado) => {
        this.pagina.update((pg) =>
          pg
            ? {
                ...pg,
                content: pg.content.map((x) => (x.id === atualizado.id ? atualizado : x)),
              }
            : pg,
        );
        this.aviso.set(`Status do impacto ${item.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(item: ImpactoCronograma): void {
    if (!confirm(`Excluir o impacto ${item.codigo} - ${item.titulo}?`)) return;
    this.aviso.set(null);
    this.api.excluirImpacto(item.projetoId, item.id).subscribe({
      next: () => {
        this.aviso.set(`Impacto ${item.codigo} excluído.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'nova' && atual.id === item.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  rotuloPendenciaItem(p: Pendencia): string {
    const status = STATUS_PENDENCIA.find((s) => s.valor === p.status)?.rotulo ?? p.status;
    return `${p.codigo} · ${p.tema} (${status})`;
  }

  private carregarPendencias(projetoId: string): void {
    this.api
      .listarPendencias(
        projetoId,
        { q: '', status: '' },
        { page: 0, size: 200, sort: 'codigo', direction: 'ASC' },
      )
      .subscribe({
        next: (p) => this.pendencias.set(p.content),
        error: () => this.pendencias.set([]),
      });
  }

  private abrirFormulario(alvo: ImpactoCronograma | 'nova'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.emEdicao.set(alvo);
  }
}
