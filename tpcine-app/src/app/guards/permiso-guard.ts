import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { Permisos } from '../services/permisos';

export const permisoGuard: CanActivateFn = async (route) => {
  const auth = inject(Auth);
  const permisos = inject(Permisos);
  const router = inject(Router);

  const usuario = (await auth.getUser()).data.user;
  if (!usuario) {
    return router.parseUrl('/login');
  }

  await permisos.cargar(usuario.id);
  return permisos.tiene(route.data['seccion']) ? true : router.parseUrl('/cartelera');
};