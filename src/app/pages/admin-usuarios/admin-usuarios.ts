import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Listagem,
  Pagina,
  PERFIS_USUARIO,
  PerfilUsuario,
  Projeto,
  Usuario,
  UsuarioRequest,
} from '../../models/admin.models';
import {
  AdminApiService,
  errosDeCampo,
  mensagemErro,
} from '../../services/admin-api.service';

const ORDENACOES = [
  { valor: 'nome', rotulo: 'Nome' },
  { valor: 'login', rotulo: 'Login' },
  { valor: 'perfil', rotulo: 'Perfil' },
  { valor: 'ativo', rotulo: 'Situação' },
  { valor: 'atualizadoEm', rotulo: 'Última atualização' },
];

interface FormUsuario {
  login: string;
  nome: string;
  senha: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  projetoIds: Set<string>;
}

function formularioVazio(): FormUsuario {
  return { login: '', nome: '', senha: '', perfil: 'USUARIO', ativo: true, projetoIds: new Set() };
}

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule],
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.scss',
})
export class AdminUsuariosComponent {
  private readonly api = inject(AdminApiService);

  readonly perfis = PERFIS_USUARIO;
  readonly ordenacoes = ORDENACOES;

  filtros: { q: string; perfil: PerfilUsuario | ''; ativo: 'true' | 'false' | '' } = {
    q: '',
    perfil: '',
    ativo: '',
  };
  readonly listagem = signal<Listagem>({ page: 0, size: 20, sort: 'nome', direction: 'ASC' });
  readonly pagina = signal<Pagina<Usuario> | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);

  readonly projetos = signal<Projeto[]>([]);

  /** `null` = formulário fechado; `'novo'` = criação; usuário = edição. */
  readonly emEdicao = signal<Usuario | 'novo' | null>(null);
  form: FormUsuario = formularioVazio();
  readonly errosForm = signal<Record<string, string>>({});
  readonly erroForm = signal<string | null>(null);
  readonly salvando = signal(false);

  constructor() {
    this.carregar();
    this.api
      .listarProjetos('', { page: 0, size: 200, sort: 'nome', direction: 'ASC' })
      .subscribe({
        next: (p) => this.projetos.set(p.content),
        error: (e) => this.erro.set(mensagemErro(e)),
      });
  }

  rotuloPerfil(perfil: PerfilUsuario): string {
    return this.perfis.find((p) => p.valor === perfil)?.rotulo ?? perfil;
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarUsuarios(this.filtros, this.listagem()).subscribe({
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

  novo(): void {
    this.form = formularioVazio();
    this.abrirFormulario('novo');
  }

  editar(u: Usuario): void {
    this.form = {
      login: u.login,
      nome: u.nome,
      senha: '',
      perfil: u.perfil,
      ativo: u.ativo,
      projetoIds: new Set(u.projetos.map((p) => p.id)),
    };
    this.abrirFormulario(u);
  }

  cancelar(): void {
    this.emEdicao.set(null);
  }

  alternarProjeto(id: string, marcado: boolean): void {
    if (marcado) {
      this.form.projetoIds.add(id);
    } else {
      this.form.projetoIds.delete(id);
    }
  }

  salvar(): void {
    const alvo = this.emEdicao();
    if (!alvo) return;

    if (this.form.perfil === 'USUARIO' && this.form.projetoIds.size === 0) {
      this.erroForm.set('Selecione ao menos um projeto para o usuário.');
      return;
    }

    const senha = this.form.senha.trim();
    const req: UsuarioRequest = {
      login: this.form.login.trim(),
      nome: this.form.nome.trim(),
      senha: senha ? senha : null,
      perfil: this.form.perfil,
      ativo: this.form.ativo,
      projetoIds: this.form.perfil === 'ADMIN' ? [] : [...this.form.projetoIds],
    };

    this.salvando.set(true);
    this.errosForm.set({});
    this.erroForm.set(null);
    const chamada =
      alvo === 'novo' ? this.api.criarUsuario(req) : this.api.atualizarUsuario(alvo.id, req);

    chamada.subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.emEdicao.set(null);
        this.aviso.set(
          `Usuário ${salvo.login} ${alvo === 'novo' ? 'criado' : 'atualizado'} com sucesso.`,
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

  excluir(u: Usuario): void {
    if (!confirm(`Excluir o usuário ${u.login} - ${u.nome}?`)) return;
    this.aviso.set(null);
    this.api.excluirUsuario(u.id).subscribe({
      next: () => {
        this.aviso.set(`Usuário ${u.login} excluído.`);
        const atual = this.emEdicao();
        if (atual && atual !== 'novo' && atual.id === u.id) {
          this.emEdicao.set(null);
        }
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e)),
    });
  }

  private abrirFormulario(alvo: Usuario | 'novo'): void {
    this.errosForm.set({});
    this.erroForm.set(null);
    this.aviso.set(null);
    this.emEdicao.set(alvo);
  }
}
