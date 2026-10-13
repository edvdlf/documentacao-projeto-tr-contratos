import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  dataBr,
  Fluxo,
  FluxoRequest,
  Listagem,
  Pagina,
  Projeto,
  STATUS_FLUXO,
  StatusFluxo,
  rotuloStatus,
  tomStatus,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
  textoOuNulo,
} from '../../services/admin-api.service';
import {
  FluxosApiService,
  InfoPacoteFluxos,
  tamanhoLegivel,
} from '../../services/fluxos-api.service';
import { ImportarPlanilhaComponent } from '../admin-shared/importar-planilha';
import { SeletorProjetoComponent } from '../admin-shared/seletor-projeto';

const ORDENACOES = [
  { valor: 'seq', rotulo: 'Sequência' },
  { valor: 'codigo', rotulo: 'ID' },
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'status', rotulo: 'Status' },
  { valor: 'dataAtualizacao', rotulo: 'Atualizado em' },
];

interface FormularioFluxo extends Omit<FluxoRequest, 'seq'> {
  seq: number | string | null;
}

function formularioVazio(): FormularioFluxo {
  return {
    seq: null,
    codigo: '',
    nome: '',
    descricao: '',
    imagem: '',
    status: 'NAO_INICIADO',
    dataAtualizacao: '',
    passos: '',
  };
}

@Component({
  selector: 'app-admin-fluxos',
  imports: [FormsModule, DatePipe, SeletorProjetoComponent, ImportarPlanilhaComponent],
  templateUrl: './admin-fluxos.html',
})
export class AdminFluxosComponent {
  private readonly api = inject(AdminApiService);
  private readonly fluxosApi = inject(FluxosApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_FLUXO;
  readonly ordenacoes = ORDENACOES;
  readonly rotuloStatus = rotuloStatus;
  readonly tomStatus = tomStatus;
  readonly dataBr = dataBr;
  readonly tamanhoLegivel = tamanhoLegivel;

  readonly projetoAtual = signal<Projeto | null>(null);
  filtros: { q: string; status: StatusFluxo | '' } = { q: '', status: '' };
  readonly listagem = signal<Listagem>({ page: 0, size: 50, sort: 'seq', direction: 'ASC' });
  readonly pagina = signal<Pagina<Fluxo> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly importando = signal(false);
  readonly importar = (arquivo: File) => this.api.importarFluxos(this.projetoAtual()!.id, arquivo);

  readonly emEdicao = signal<Fluxo | 'novo' | null>(null);
  form: FormularioFluxo = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  readonly pacote = signal<InfoPacoteFluxos | null>(null);
  readonly arquivoPacote = signal<File | null>(null);
  readonly enviandoPacote = signal(false);
  readonly mensagemPacote = signal<string | null>(null);
  readonly erroPacote = signal<string | null>(null);

  constructor() {
    this.carregarPacote();
  }

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
    this.api.listarFluxos(projeto.id, this.filtros, this.listagem()).subscribe({
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

  editar(f: Fluxo): void {
    this.form = {
      seq: f.seq,
      codigo: f.codigo,
      nome: f.nome,
      descricao: f.descricao ?? '',
      imagem: f.imagem ?? '',
      status: f.status,
      dataAtualizacao: f.dataAtualizacao ?? '',
      passos: f.passos ?? '',
    };
    this.abrirFormulario(f);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  salvar(): void {
    const alvo = this.emEdicao();
    const projeto = this.projetoAtual();
    if (!alvo || !projeto) return;

    const seq = this.form.seq === null || this.form.seq === '' ? null : Number(this.form.seq);
    const req: FluxoRequest = {
      seq,
      codigo: this.form.codigo.trim(),
      nome: this.form.nome.trim(),
      descricao: textoOuNulo(this.form.descricao),
      imagem: textoOuNulo(this.form.imagem),
      status: this.form.status,
      dataAtualizacao: textoOuNulo(this.form.dataAtualizacao),
      passos: textoOuNulo(this.form.passos),
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'novo'
        ? this.api.criarFluxo(projeto.id, req)
        : this.api.atualizarFluxo(projeto.id, alvo.id, req);

    chamada.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Fluxo ${salvo.nome} ${alvo === 'novo' ? 'criado' : 'atualizado'} com sucesso.`,
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

  alterarStatus(f: Fluxo, status: StatusFluxo): void {
    this.aviso.set(null);
    this.api.alterarStatusFluxo(f.projetoId, f.id, status).subscribe({
      next: (atualizado) => {
        this.pagina.update((p) =>
          p
            ? { ...p, content: p.content.map((x) => (x.id === atualizado.id ? atualizado : x)) }
            : p,
        );
        this.aviso.set(`Status do fluxo ${f.nome} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregar();
      },
    });
  }

  excluir(f: Fluxo): void {
    if (!confirm(`Excluir o fluxo ${f.nome}?`)) return;
    this.aviso.set(null);
    this.api.excluirFluxo(f.projetoId, f.id).subscribe({
      next: () => {
        this.aviso.set(`Fluxo ${f.nome} excluído.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'novo' && atual.id === f.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  urlVisualizador(info: InfoPacoteFluxos): string | null {
    return this.fluxosApi.urlVisualizador(info);
  }

  selecionarPacote(evento: Event): void {
    this.arquivoPacote.set((evento.target as HTMLInputElement).files?.[0] ?? null);
    this.mensagemPacote.set(null);
    this.erroPacote.set(null);
  }

  publicarPacote(): void {
    const arquivo = this.arquivoPacote();
    if (!arquivo) return;
    this.enviandoPacote.set(true);
    this.mensagemPacote.set(null);
    this.erroPacote.set(null);
    this.fluxosApi.publicar(arquivo).subscribe({
      next: (info) => {
        this.pacote.set(info);
        this.mensagemPacote.set(`Pacote publicado com ${info.arquivos} arquivo(s).`);
        this.enviandoPacote.set(false);
      },
      error: (e) => {
        this.erroPacote.set(mensagemErro(e));
        this.enviandoPacote.set(false);
      },
    });
  }

  removerPacote(): void {
    if (!confirm('Remover o pacote de fluxos publicado? O visualizador ficará indisponível.')) return;
    this.erroPacote.set(null);
    this.fluxosApi.remover().subscribe({
      next: () => {
        this.mensagemPacote.set('Pacote removido.');
        this.carregarPacote();
      },
      error: (e) => this.erroPacote.set(mensagemErro(e)),
    });
  }

  private carregarPacote(): void {
    this.fluxosApi.info().subscribe({
      next: (info) => this.pacote.set(info),
      error: (e) => this.erroPacote.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Fluxo | 'novo'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.importando.set(false);
    this.emEdicao.set(alvo);
  }
}
