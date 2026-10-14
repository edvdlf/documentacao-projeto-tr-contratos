import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { ProjetoService } from './services/projeto.service';

const TemaVetorit = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf3eb',
      100: '#f8eadd',
      200: '#f3c9a8',
      300: '#eba373',
      400: '#e2733a',
      500: '#d64000',
      600: '#b83700',
      700: '#993500',
      800: '#7a2a00',
      900: '#5c2000',
      950: '#3d1500',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: TemaVetorit, options: { darkModeSelector: false } } }),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(ProjetoService).carregar()),
  ],
};
