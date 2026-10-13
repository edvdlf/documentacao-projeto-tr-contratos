import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  Atividade,
  AtividadeRequest,
  Projeto,
  STATUS_ATIVIDADE,
  Sprint,
  StatusAtividade,
  dataBr,
  rotuloStatus,
  tomStatus,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
  textoOuNulo,
} from '../../services/admin-api.service';
import { SeletorProjetoComponent } from '../admin-shared/seletor-projeto';

interface FormularioItem {
  codigo: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  status: StatusAtividade;
  observacoes: string;
}

function formularioVazio(responsavel = '', status: StatusAtividade = 'PLANEJADA'): FormularioItem {
  return { codigo: '', titulo: '', descricao: '', responsavel, status, observacoes: '' };
}

/** Sprint que o portal exibe em "Próxima Sprint": a primeira (pela data) ainda não concluída. */
function sprintDoPortal(sprints: Sprint[]): Sprint | undefined {
  return sprints.find((s) => s.status !== 'CONCLUIDA' && s.status !== 'CANCELADA');
}

/** Próximo código da sequência: "RF041" → "RF042" (mantém prefixo e zeros à esquerda). */
function proximoCodigo(codigos: string[]): string {
  let melhor: { prefixo: string; numero: number; largura: number } | null = null;
  for (const codigo of codigos) {
    const m = /^(.*?)(\d+)$/.exec(codigo.trim());
    if (!m) continue;
    const numero = Number(m[2]);
    if (!melhor || numero > melhor.numero) {
      melhor = { prefixo: m[1], numero, largura: m[2].length };
    }
  }
  if (!melhor) return '';
  return melhor.prefixo + String(melhor.numero + 1).padStart(melhor.largura, '0');
}

@Component({
  selector: 'app-admin-proxima-sprint',
  imports: [FormsModule, RouterLink, SeletorProjetoComponent],
  templateUrl: './admin-proxima-sprint.html',
})
export class AdminProximaSprintComponent {
  private readonly api = inject(AdminApiService);

  /** Query param `?projeto=<id>`. */
  readonly projeto = input<string>();

  readonly statusOpcoes = STATUS_ATIVIDADE;
  readonly rotuloStatus = rotuloStatus;
  readonly tomStatus = tomStatus;
  readonly dataBr = dataBr;

  readonly projetoAtual = signal<Projeto | null>(null);
  /** Sprints não concluídas nem canceladas, pela data de início. */
  readonly sprintsAbertas = signal<Sprint[]>([]);
  readonly sprintPortal = signal<Sprint | null>(null);
  readonly sprintSelecionada = signal<Sprint | null>(null);
  readonly itens = signal<Atividade[]>([]);
  /** Códigos já usados no projeto, para sugerir o próximo. */
  private readonly codigosProjeto = signal<string[]>([]);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  /** `null` = adicionando item novo; atividade = editando. */
  readonly emEdicao = signal<Atividade | null>(null);
  form: FormularioItem = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  readonly codigoSugerido = computed(() => proximoCodigo(this.codigosProjeto()));

  private readonly campoCodigo = viewChild<ElementRef<HTMLInputElement>>('campoCodigo');

  aoSelecionarProjeto(projeto: Projeto | null): void {
    this.projetoAtual.set(projeto);
    this.aviso.set(null);
    this.sprintsAbertas.set([]);
    this.sprintPortal.set(null);
    this.sprintSelecionada.set(null);
    this.itens.set([]);
    this.novoItem();
    if (projeto) this.carregarSprints(projeto);
  }

  selecionarSprint(id: string): void {
    const sprint = this.sprintsAbertas().find((s) => s.id === id) ?? null;
    this.sprintSelecionada.set(sprint);
    this.aviso.set(null);
    this.novoItem();
    this.carregarItens();
  }

  carregarItens(): void {
    const projeto = this.projetoAtual();
    const sprint = this.sprintSelecionada();
    if (!projeto || !sprint) {
      this.itens.set([]);
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    forkJoin({
      daSprint: this.api.listarAtividades(
        projeto.id,
        { sprint: sprint.nome, status: '' },
        { page: 0, size: 200, sort: 'codigo', direction: 'ASC' },
      ),
      doProjeto: this.api.listarAtividades(
        projeto.id,
        { sprint: '', status: '' },
        { page: 0, size: 200, sort: 'criadoEm', direction: 'DESC' },
      ),
    }).subscribe({
      next: ({ daSprint, doProjeto }) => {
        this.itens.set(daSprint.content.filter((a) => pertence(a.sprint, sprint)));
        this.codigosProjeto.set(doProjeto.content.map((a) => a.codigo));
        if (!this.emEdicao() && !this.form.codigo) this.form.codigo = this.codigoSugerido();
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      },
    });
  }

  novoItem(): void {
    this.emEdicao.set(null);
    this.form = formularioVazio(this.form.responsavel, this.form.status);
    this.form.codigo = this.codigoSugerido();
    this.errosForm.set({});
    this.erroForm.set(null);
  }

  editar(a: Atividade): void {
    this.form = {
      codigo: a.codigo,
      titulo: a.titulo,
      descricao: a.descricao ?? '',
      responsavel: a.responsavel ?? '',
      status: a.status,
      observacoes: a.observacoes ?? '',
    };
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.emEdicao.set(a);
    this.focarCodigo();
  }

  salvar(): void {
    const projeto = this.projetoAtual();
    const sprint = this.sprintSelecionada();
    if (!projeto || !sprint) return;
    const alvo = this.emEdicao();

    const req: AtividadeRequest = {
      codigo: this.form.codigo.trim(),
      sprint: alvo ? alvo.sprint : sprint.rotulo,
      titulo: this.form.titulo.trim(),
      descricao: textoOuNulo(this.form.descricao),
      responsavel: textoOuNulo(this.form.responsavel),
      status: this.form.status,
      observacoes: textoOuNulo(this.form.observacoes),
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada = alvo
      ? this.api.atualizarAtividade(projeto.id, alvo.id, req)
      : this.api.criarAtividade(projeto.id, req);

    chamada.subscribe({
      next: (salva) => {
        this.salvando.set(false);
        this.aviso.set(
          `Item ${salva.codigo} ${alvo ? 'atualizado' : 'adicionado à ' + sprint.nome}.`,
        );
        if (alvo) {
          this.itens.update((lista) => lista.map((x) => (x.id === salva.id ? salva : x)));
        } else {
          this.itens.update((lista) => [...lista, salva]);
          this.codigosProjeto.update((c) => [...c, salva.codigo]);
        }
        this.novoItem();
        this.focarCodigo();
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
        this.itens.update((lista) => lista.map((x) => (x.id === atualizada.id ? atualizada : x)));
        this.aviso.set(`Status do item ${a.codigo} alterado para ${rotuloStatus(status)}.`);
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregarItens();
      },
    });
  }

  excluir(a: Atividade): void {
    if (!confirm(`Excluir o item ${a.codigo} - ${a.titulo}?`)) return;
    this.aviso.set(null);
    this.api.excluirAtividade(a.projetoId, a.id).subscribe({
      next: () => {
        this.itens.update((lista) => lista.filter((x) => x.id !== a.id));
        this.aviso.set(`Item ${a.codigo} excluído.`);
        if (this.emEdicao()?.id === a.id) this.novoItem();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private carregarSprints(projeto: Projeto): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api
      .listarSprints(
        projeto.id,
        { q: '', status: '' },
        { page: 0, size: 200, sort: 'dataInicio', direction: 'ASC' },
      )
      .subscribe({
        next: (pagina) => {
          const abertas = pagina.content.filter(
            (s) => s.status !== 'CONCLUIDA' && s.status !== 'CANCELADA',
          );
          const portal = sprintDoPortal(pagina.content) ?? null;
          this.sprintsAbertas.set(abertas);
          this.sprintPortal.set(portal);
          this.sprintSelecionada.set(portal);
          this.carregando.set(false);
          this.carregarItens();
        },
        error: (e) => {
          this.erro.set(mensagemErro(e));
          this.carregando.set(false);
        },
      });
  }

  private focarCodigo(): void {
    setTimeout(() => this.campoCodigo()?.nativeElement.focus());
  }
}

/** Mesma regra da API: o campo sprint é igual ao nome ou começa por ele seguido de espaço. */
function pertence(textoSprint: string | null, sprint: Sprint): boolean {
  if (!textoSprint) return false;
  const texto = textoSprint.trim().toLowerCase();
  const nome = sprint.nome.toLowerCase();
  return texto === nome || texto.startsWith(`${nome} `);
}
