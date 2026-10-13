import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Burndown } from '../../models/projeto.models';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

/** Mesmas cores dos cabeçalhos "Meta" e "Restante" da tabela de evolução. */
export const COR_META = '#f0a500';
export const COR_RESTANTE = '#b04fc9';

type GraficoBurndown = Chart<'line', (number | null)[], string>;

@Component({
  selector: 'app-burndown-grafico',
  template: `
    <div class="burndown">
      <canvas #canvas role="img" [attr.aria-label]="descricao()"></canvas>
    </div>
  `,
  styles: `
    .burndown {
      position: relative;
      height: 100%;
      min-height: 280px;
    }
  `,
})
export class BurndownGraficoComponent {
  readonly dados = input.required<Burndown>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private grafico: GraficoBurndown | null = null;

  constructor() {
    effect(() => {
      const dados = this.dados();
      const canvas = this.canvas().nativeElement;
      const rotulos = ['Início', ...dados.linhas.map((l) => l.sprint)];
      const meta = [dados.total, ...dados.linhas.map((l) => l.meta)];
      const restante = [dados.total, ...dados.linhas.map((l) => l.restante)];

      if (this.grafico) {
        this.grafico.data.labels = rotulos;
        this.grafico.data.datasets[0].data = meta;
        this.grafico.data.datasets[1].data = restante;
        this.grafico.update();
      } else {
        this.grafico = criarGrafico(canvas, rotulos, meta, restante);
      }
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  descricao(): string {
    const d = this.dados();
    const ultimo = [...d.linhas].reverse().find((l) => l.restante !== null);
    return `Burndown: ${ultimo?.restante ?? d.total} de ${d.total} tarefas restantes`;
  }
}

function criarGrafico(
  canvas: HTMLCanvasElement,
  rotulos: string[],
  meta: number[],
  restante: (number | null)[],
): GraficoBurndown {
  const estilo = getComputedStyle(document.documentElement);
  const texto = estilo.getPropertyValue('--dove').trim() || '#666666';
  const grade = estilo.getPropertyValue('--mercury').trim() || '#e9e9e9';

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: rotulos,
      datasets: [
        {
          label: 'Meta',
          data: meta,
          borderColor: COR_META,
          backgroundColor: COR_META,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
        },
        {
          label: 'Restante',
          data: restante,
          borderColor: COR_RESTANTE,
          backgroundColor: COR_RESTANTE,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          spanGaps: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: texto },
          grid: { color: grade },
          border: { display: false },
        },
        x: {
          ticks: { color: texto, maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 14, boxHeight: 3, color: texto },
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.parsed.y === null
                ? `${ctx.dataset.label}: —`
                : `${ctx.dataset.label}: ${ctx.parsed.y} tarefa(s)`,
          },
        },
      },
    },
  });
}
