import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Atividade,
  AtividadeRequest,
  Fluxo,
  FluxoRequest,
  ImpactoCronograma,
  ImpactoRequest,
  Listagem,
  Pagina,
  Pendencia,
  PendenciaRequest,
  ProblemDetail,
  Projeto,
  ProjetoRequest,
  ResultadoImportacao,
  Risco,
  RiscoRequest,
  Sprint,
  SprintRequest,
  StatusAtividade,
  StatusFluxo,
  StatusImpacto,
  StatusPendencia,
  StatusProjeto,
  StatusRisco,
  StatusSprint,
  PerfilUsuario,
  Usuario,
  UsuarioRequest,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/projetos`;
  private readonly usuarios = `${environment.apiUrl}/api/usuarios`;

  listarProjetos(q: string, listagem: Listagem): Observable<Pagina<Projeto>> {
    return this.http.get<Pagina<Projeto>>(this.base, { params: parametros({ q, ...listagem }) });
  }

  buscarProjeto(id: string): Observable<Projeto> {
    return this.http.get<Projeto>(`${this.base}/${id}`);
  }

  criarProjeto(req: ProjetoRequest): Observable<Projeto> {
    return this.http.post<Projeto>(this.base, req);
  }

  atualizarProjeto(id: string, req: ProjetoRequest): Observable<Projeto> {
    return this.http.put<Projeto>(`${this.base}/${id}`, req);
  }

  excluirProjeto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  alterarStatusProjeto(id: string, status: StatusProjeto): Observable<Projeto> {
    return this.http.patch<Projeto>(`${this.base}/${id}/status`, { status });
  }

  listarSprints(
    projetoId: string,
    filtros: { q: string; status: StatusSprint | '' },
    listagem: Listagem,
  ): Observable<Pagina<Sprint>> {
    return this.http.get<Pagina<Sprint>>(`${this.base}/${projetoId}/sprints`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarSprint(projetoId: string, req: SprintRequest): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.base}/${projetoId}/sprints`, req);
  }

  atualizarSprint(projetoId: string, id: string, req: SprintRequest): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.base}/${projetoId}/sprints/${id}`, req);
  }

  alterarStatusSprint(projetoId: string, id: string, status: StatusSprint): Observable<Sprint> {
    return this.http.patch<Sprint>(`${this.base}/${projetoId}/sprints/${id}/status`, { status });
  }

  excluirSprint(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/sprints/${id}`);
  }

  baixarTemplateSprints(projetoId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${projetoId}/sprints/importacoes/template`, {
      responseType: 'blob',
    });
  }

  importarSprints(projetoId: string, arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/${projetoId}/sprints/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  listarFluxos(
    projetoId: string,
    filtros: { q: string; status: StatusFluxo | '' },
    listagem: Listagem,
  ): Observable<Pagina<Fluxo>> {
    return this.http.get<Pagina<Fluxo>>(`${this.base}/${projetoId}/fluxos`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarFluxo(projetoId: string, req: FluxoRequest): Observable<Fluxo> {
    return this.http.post<Fluxo>(`${this.base}/${projetoId}/fluxos`, req);
  }

  atualizarFluxo(projetoId: string, id: string, req: FluxoRequest): Observable<Fluxo> {
    return this.http.put<Fluxo>(`${this.base}/${projetoId}/fluxos/${id}`, req);
  }

  alterarStatusFluxo(projetoId: string, id: string, status: StatusFluxo): Observable<Fluxo> {
    return this.http.patch<Fluxo>(`${this.base}/${projetoId}/fluxos/${id}/status`, { status });
  }

  excluirFluxo(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/fluxos/${id}`);
  }

  importarFluxos(projetoId: string, arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/${projetoId}/fluxos/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  listarPendencias(
    projetoId: string,
    filtros: { q: string; status: StatusPendencia | '' },
    listagem: Listagem,
  ): Observable<Pagina<Pendencia>> {
    return this.http.get<Pagina<Pendencia>>(`${this.base}/${projetoId}/pendencias`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarPendencia(projetoId: string, req: PendenciaRequest): Observable<Pendencia> {
    return this.http.post<Pendencia>(`${this.base}/${projetoId}/pendencias`, req);
  }

  atualizarPendencia(projetoId: string, id: string, req: PendenciaRequest): Observable<Pendencia> {
    return this.http.put<Pendencia>(`${this.base}/${projetoId}/pendencias/${id}`, req);
  }

  alterarStatusPendencia(
    projetoId: string,
    id: string,
    status: StatusPendencia,
  ): Observable<Pendencia> {
    return this.http.patch<Pendencia>(`${this.base}/${projetoId}/pendencias/${id}/status`, {
      status,
    });
  }

  excluirPendencia(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/pendencias/${id}`);
  }

  listarImpactos(
    projetoId: string,
    filtros: { q: string; status: StatusImpacto | '' },
    listagem: Listagem,
  ): Observable<Pagina<ImpactoCronograma>> {
    return this.http.get<Pagina<ImpactoCronograma>>(`${this.base}/${projetoId}/impactos`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarImpacto(projetoId: string, req: ImpactoRequest): Observable<ImpactoCronograma> {
    return this.http.post<ImpactoCronograma>(`${this.base}/${projetoId}/impactos`, req);
  }

  atualizarImpacto(
    projetoId: string,
    id: string,
    req: ImpactoRequest,
  ): Observable<ImpactoCronograma> {
    return this.http.put<ImpactoCronograma>(`${this.base}/${projetoId}/impactos/${id}`, req);
  }

  alterarStatusImpacto(
    projetoId: string,
    id: string,
    status: StatusImpacto,
  ): Observable<ImpactoCronograma> {
    return this.http.patch<ImpactoCronograma>(`${this.base}/${projetoId}/impactos/${id}/status`, {
      status,
    });
  }

  excluirImpacto(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/impactos/${id}`);
  }

  importarPendencias(projetoId: string, arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/${projetoId}/pendencias/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  listarRiscos(
    projetoId: string,
    filtros: { q: string; status: StatusRisco | '' },
    listagem: Listagem,
  ): Observable<Pagina<Risco>> {
    return this.http.get<Pagina<Risco>>(`${this.base}/${projetoId}/riscos`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarRisco(projetoId: string, req: RiscoRequest): Observable<Risco> {
    return this.http.post<Risco>(`${this.base}/${projetoId}/riscos`, req);
  }

  atualizarRisco(projetoId: string, id: string, req: RiscoRequest): Observable<Risco> {
    return this.http.put<Risco>(`${this.base}/${projetoId}/riscos/${id}`, req);
  }

  alterarStatusRisco(projetoId: string, id: string, status: StatusRisco): Observable<Risco> {
    return this.http.patch<Risco>(`${this.base}/${projetoId}/riscos/${id}/status`, { status });
  }

  excluirRisco(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/riscos/${id}`);
  }

  importarRiscos(projetoId: string, arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/${projetoId}/riscos/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  listarAtividades(
    projetoId: string,
    filtros: { sprint: string; status: StatusAtividade | '' },
    listagem: Listagem,
  ): Observable<Pagina<Atividade>> {
    return this.http.get<Pagina<Atividade>>(`${this.base}/${projetoId}/atividades`, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarAtividade(projetoId: string, req: AtividadeRequest): Observable<Atividade> {
    return this.http.post<Atividade>(`${this.base}/${projetoId}/atividades`, req);
  }

  atualizarAtividade(projetoId: string, id: string, req: AtividadeRequest): Observable<Atividade> {
    return this.http.put<Atividade>(`${this.base}/${projetoId}/atividades/${id}`, req);
  }

  alterarStatusAtividade(
    projetoId: string,
    id: string,
    status: StatusAtividade,
  ): Observable<Atividade> {
    return this.http.patch<Atividade>(`${this.base}/${projetoId}/atividades/${id}/status`, {
      status,
    });
  }

  excluirAtividade(projetoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${projetoId}/atividades/${id}`);
  }

  baixarTemplateProjetos(): Observable<Blob> {
    return this.http.get(`${this.base}/importacoes/template`, { responseType: 'blob' });
  }

  importarProjetos(arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  importarAtividades(projetoId: string, arquivo: File): Observable<ResultadoImportacao> {
    return this.http.post<ResultadoImportacao>(
      `${this.base}/${projetoId}/importacoes/planilha`,
      formulario(arquivo),
    );
  }

  listarUsuarios(
    filtros: { q: string; perfil: PerfilUsuario | ''; ativo: 'true' | 'false' | '' },
    listagem: Listagem,
  ): Observable<Pagina<Usuario>> {
    return this.http.get<Pagina<Usuario>>(this.usuarios, {
      params: parametros({ ...filtros, ...listagem }),
    });
  }

  criarUsuario(req: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.usuarios, req);
  }

  atualizarUsuario(id: string, req: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.usuarios}/${id}`, req);
  }

  excluirUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.usuarios}/${id}`);
  }
}

/** Mensagem legível para exibir ao usuário a partir de um erro da API. */
export function mensagemErro(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Não foi possível conectar à API. Verifique se o backend está no ar.';
    }
    const corpo = err.error as ProblemDetail | null;
    if (corpo && typeof corpo === 'object' && corpo.detail) {
      return corpo.detail;
    }
    return `Erro ${err.status} ao chamar a API.`;
  }
  return 'Erro inesperado.';
}

/** Erros de validação por campo (`erros` do ProblemDetail), quando houver. */
export function errosDeCampo(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    return (err.error as ProblemDetail).erros ?? {};
  }
  return {};
}

/** Remove espaços e converte texto vazio em null, como a API espera nos campos opcionais. */
export function textoOuNulo(valor: string | null | undefined): string | null {
  const t = (valor ?? '').trim();
  return t ? t : null;
}

export function salvarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function parametros(valores: Record<string, string | number>): HttpParams {
  let params = new HttpParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor !== '' && valor !== null && valor !== undefined) {
      params = params.set(chave, String(valor).trim());
    }
  }
  return params;
}

function formulario(arquivo: File): FormData {
  const dados = new FormData();
  dados.append('arquivo', arquivo, arquivo.name);
  return dados;
}
