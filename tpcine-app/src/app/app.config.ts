import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ButacasService } from './services/butacas';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    ButacasService
  ]
};