import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Auth } from '../services/auth';

// Solo deja matchear la ruta si el rol es admin. Si devuelve false, el router sigue
// con las demás rutas (acá termina en "**" y redirige a películas).
export const roleGuard: CanMatchFn = async (route, segments) => {
  const auth = inject(Auth);

  const rol = await auth.obtenerRol();

  return rol === 'admin';
};