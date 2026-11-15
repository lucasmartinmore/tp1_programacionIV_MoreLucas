import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { formGuard } from './guards/form-guard';
import { personalGuard } from './guards/personal-guard';

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
    // Los puntos son de cada usuario: hay que estar logueado (si es una página informativa pública, sacá el canActivate)
    path: 'club-puntos', 
    loadComponent: () => import('./components/club-puntos/club-puntos').then(m => m.ClubPuntos),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./components/registros/registro').then(m => m.Registro),
    // Si dejo el formulario a medias, pregunta antes de salir
    canDeactivate: [formGuard]
  },
  {
    // Para pagar hay que estar logueado: si no, authGuard lo manda a /login
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout),
  },
  {
    path: 'ticket',
    loadComponent: () => import('./components/ticket/ticket').then(m => m.Ticket),
  },

    {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin').then(m => m.Admin),
    // CanMatch: si el rol no es admin, la ruta "no existe" y cae en '**'
    canMatch: [roleGuard],
    children: [
      { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
      {
        path: 'peliculas',
        loadComponent: () => import('./components/admin/admin-peliculas/admin-peliculas').then(m => m.AdminPeliculas)
      },
      {
        path: 'peliculas/nueva',
        loadComponent: () => import('./components/admin/pelicula-form/pelicula-form').then(m => m.PeliculaForm)
      },
      {
        path: 'peliculas/:id/editar',
        loadComponent: () => import('./components/admin/pelicula-form/pelicula-form').then(m => m.PeliculaForm)
      },
      {
        path: 'funciones',
        loadComponent: () => import('./components/admin/admin-funciones/admin-funciones').then(m => m.AdminFunciones)
      },
            {
        path: 'productos',
        loadComponent: () => import('./components/admin/admin-productos/admin-productos').then(m => m.AdminProductos)
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./components/admin/producto-form/producto-form').then(m => m.ProductoForm)
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () => import('./components/admin/producto-form/producto-form').then(m => m.ProductoForm)
      },
      {
        path: 'cupones',
        loadComponent: () => import('./components/admin/admin-cupones/admin-cupones').then(m => m.AdminCupones)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./components/admin/admin-reportes/admin-reportes').then(m => m.AdminReportes)
      },
      {
        path: 'recompensas',
        loadComponent: () => import('./components/admin/admin-recompensas/admin-recompensas').then(m => m.AdminRecompensas)
      },
    ]
  },
  {
    path: 'empleado',
    loadComponent: () => import('./components/empleado/validador/validador').then(m => m.Validador),
    canMatch: [personalGuard]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./components/perfil/perfil').then(m => m.Perfil),
    canActivate: [authGuard]
  },
  { 
    path: '**', redirectTo: 'peliculas' 
  }
];