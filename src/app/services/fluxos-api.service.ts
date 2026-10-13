import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Situação do pacote web do Bizagi publicado na API. */
export interface InfoPacoteFluxos {
  disponivel: boolean;
  nomeArquivo: string | null;
  publicadoEm: string | null;
  arquivos: number;
  tamanhoBytes: number;
  /** Caminho relativo à raiz da API (ex.: `/fluxos/index.html`). */
  url: string | null;
}

@Injectable({ providedIn: 'root' })
export class FluxosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/fluxos/pacote`;

  info(): Observable<InfoPacoteFluxos> {
    return this.http.get<InfoPacoteFluxos>(this.base);
  }

  publicar(arquivo: File): Observable<InfoPacoteFluxos> {
    const dados = new FormData();
    dados.append('arquivo', arquivo, arquivo.name);
    return this.http.post<InfoPacoteFluxos>(this.base, dados);
  }

  remover(): Observable<void> {
    return this.http.delete<void>(this.base);
  }

  /** URL absoluta do visualizador, abrindo direto na lista de diagramas. */
  urlVisualizador(info: InfoPacoteFluxos): string | null {
    return info.disponivel && info.url ? `${environment.apiUrl}${info.url}#diagram/` : null;
  }
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
