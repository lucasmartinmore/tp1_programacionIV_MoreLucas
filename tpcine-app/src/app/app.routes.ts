import { Routes } from '@angular/router';
import { Cartelera } from './components/cartelera/cartelera';
import { Proximamente } from './components/proximamente/proximamente';

export const routes: Routes = [
  { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
  { path: 'peliculas', component: Cartelera },
  { path: 'proximamente', component: Proximamente },
  { path: '**', redirectTo: 'peliculas' } 
];