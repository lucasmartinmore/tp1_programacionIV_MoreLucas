import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
  { 
    path: 'peliculas', 
    loadComponent: () => import('./components/cartelera/cartelera').then(m => m.Cartelera) 
  },
  { 
    path: 'sala/:id', 
    loadComponent: () => import('./components/sala/sala').then(m => m.Sala) 
  },
  {
  path: 'funciones/:id',
  loadComponent: () => import('./components/funciones/funciones').then(m => m.FuncionesPage)
  },
  { 
    path: 'candy', 
    loadComponent: () => import('./components/candy/candy').then(m => m.Candy) 
  },
  { 
    path: 'proximamente', 
    loadComponent: () => import('./components/proximamente/proximamente').then(m => m.Proximamente) 
  },
  { 
    path: 'club-puntos', 
    loadComponent: () => import('./components/club-puntos/club-puntos').then(m => m.ClubPuntos) 
  },
  { path: '**', redirectTo: 'peliculas' }
];