import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  dataBr,
  Listagem,
  NIVEIS,
  Pagina,
  Pendencia,
  PendenciaRequest,
  Projeto,
  STATUS_PENDENCIA,
  StatusPendencia,
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
  { valor: 'tema', rotulo: 'Tema' },
  { valor: 'responsavel', rotulo: 'Responsável' },
  { valor: 'prazo', rotulo: 'Prazo' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'impacto', rotulo: 'Impacto' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

interface FormularioPendencia {
  codigo: string;
  tema: string;
  pergunta: string;
  responsavel: string;
  prazo: string;
  status: StatusPendencia;
  impacto: string;
}

function formularioVazio(): FormularioPendencia {
  return {
    codigo: '',
    tema: '',
    pergunta: '',
    responsavel: '',
    prazo: '',
    status: 'ABERTA',
    impacto: '',
  };
}

@Component({
  selector: 'app-admin-pendencias',
  imports: [FormsModule, SeletorProjetoComponent, ImportarPlanilhaComponent],
  templateUrl: './admin-pendencias.html',
})
export class AdminPendenciasComponent {
  private readonly api = inject(AdminApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_PENDENCIA;
  readonly niveis = NIVEIS;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly rotuloNivel = rotuloNivel;
  readonly tomStatus = tomStatus;
  readonly dataBr = dataBr;

  readonly projetoAtual = signal<Projeto | null>(null);
  filtros: { q: string; status: StatusPendencia | '' } = { q: '', status: '' };
  readonly listagem = signal<Listagem>({ page: 0, size: 50, sort: 'codigo', direction: 'ASC' });
  readonly pagina = signal<Pagina<Pendencia> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly importar = (arquivo: File) =>
    this.api.importarPendencias(this.projetoAtual()!.id, arquivo);

  readonly emEdicao = signal<Pendencia | 'nova' | null>(null);
  form: FormularioPendencia = formularioVazio();
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
    this.api.listarPendencias(projeto.id, this.filtros, this.listagem()).subscribe({
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

  editar(p: Pendencia): void {
    this.form = {
      codigo: p.codigo,
      tema: p.tema,
      pergunta: p.pergunta ?? '',
      responsavel: p.responsavel ?? '',
      prazo: p.prazo ?? '',
      status: p.status,
      impacto: p.impacto ?? '',
    };
    this.abrirFormulario(p);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const req: PendenciaRequest = {
      codigo: this.form.codigo.trim(),
      tema: this.form.tema.trim(),
      pergunta: textoOuNulo(this.form.pergunta),
      responsavel: textoOuNulo(this.form.responsavel),
      prazo: textoOuNulo(this.form.prazo),
      status: this.form.status,
      impacto: (textoOuNulo(this.form.impacto) as PendenciaRequest['impacto']) ?? null,
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'nova'
        ? this.api.criarPendencia(projeto.id, req)
        : this.api.atualizarPendencia(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salva) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Pendência ${salva.codigo} ${alvo === 'nova' ? 'criada' : 'atualizada'} com sucesso.`,
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

  alterarStatus(p: Pendencia, status: StatusPendencia): void {
    this.aviso.set(null);
    this.api.alterarStatusPendencia(p.projetoId, p.id, status).subscribe({
      next: (atualizada) => {
        this.pagina.update((pg) =>
          pg
            ? { ...pg, content: pg.content.map((x) => (x.id === atualizada.id ? atualizada : x)) }
            : pg,
        );
        this.aviso.set(`Status da pendência ${p.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(p: Pendencia): void {
    if (!confirm(`Excluir a pendência ${p.codigo} - ${p.tema}?`)) return;
    this.aviso.set(null);
    this.api.excluirPendencia(p.projetoId, p.id).subscribe({
      next: () => {
        this.aviso.set(`Pendência ${p.codigo} excluída.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'nova' && atual.id === p.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Pendencia | 'nova'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
