import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  inject,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { LenisScrollService } from './lenis-scroll.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    provideAppInitializer(() => {
      inject(LenisScrollService).start();
    }),
  ]
};
