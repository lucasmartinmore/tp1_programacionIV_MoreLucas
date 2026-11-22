import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Auth } from '../services/auth';
import { Permisos } from '../services/permisos';

// Solo deja matchear la ruta si el rol es admin o tiene un rol configurable.
// Si devuelve false, el router sigue con las demás rutas (acá termina en "**" y redirige a películas).
export const roleGuard: CanMatchFn = async (route, segments) => {
  const auth = inject(Auth);
  const permisos = inject(Permisos);

  const rol = await auth.obtenerRol();

  return rol === 'admin' || permisos.tieneAlguno();
};