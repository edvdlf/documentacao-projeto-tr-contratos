import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export const COR_BARRA = '#118dff';

export interface Barra {
  rotulo: string;
  valor: number;
  /** Padrão: {@link COR_BARRA}. */
  cor?: string;
}

type GraficoBarras = Chart<'bar', number[], string>;

/** Barras horizontais, no estilo dos visuais do Power BI. */
@Component({
  selector: 'app-barras-grafico',
  template: `
    <div class="barras">
      <canvas #canvas role="img" [attr.aria-label]="descricao()"></canvas>
    </div>
  `,
  styles: `
    .barras {
      position: relative;
      height: 100%;
      min-height: 180px;
    }
  `,
})
export class BarrasGraficoComponent {
  readonly barras = input.required<Barra[]>();
  readonly titulo = input('');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private grafico: GraficoBarras | null = null;

  constructor() {
    effect(() => {
      const barras = this.barras();
      const rotulos = barras.map((b) => b.rotulo);
      const valores = barras.map((b) => b.valor);
      const cores = barras.map((b) => b.cor ?? COR_BARRA);
      if (this.grafico) {
        this.grafico.data.labels = rotulos;
        this.grafico.data.datasets[0].data = valores;
        this.grafico.data.datasets[0].backgroundColor = cores;
        this.grafico.update();
      } else {
        this.grafico = criarGrafico(this.canvas().nativeElement, rotulos, valores, cores);
      }
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  descricao(): string {
    const itens = this.barras().map((b) => `${b.rotulo}: ${b.valor}`);
    return `${this.titulo()}. ${itens.length ? itens.join('; ') : 'Sem dados'}`;
  }
}

function criarGrafico(
  canvas: HTMLCanvasElement,
  rotulos: string[],
  valores: number[],
  cores: string[],
): GraficoBarras {
  const estilo = getComputedStyle(document.documentElement);
  const texto = estilo.getPropertyValue('--dove').trim() || '#666666';
  const grade = estilo.getPropertyValue('--mercury').trim() || '#e9e9e9';

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: rotulos,
      datasets: [
        {
          data: valores,
          backgroundColor: cores,
          maxBarThickness: 16,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: texto },
          grid: { color: grade },
          border: { display: false },
        },
        y: {
          ticks: { color: texto, font: { size: 11 } },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${ctx.parsed.x} retificação(ões)` },
        },
      },
    },
  });
}
