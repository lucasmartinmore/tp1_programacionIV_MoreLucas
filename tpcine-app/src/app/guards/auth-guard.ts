import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

// Deja pasar solo si hay un usuario logueado
// si no, lo manda al login
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const resultado = await auth.getUser();

  if (resultado.data.user) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};