import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { Auth } from '../services/auth';

// Deja pasar a admin y empleado
export const personalGuard: CanMatchFn = async (route, segments) => {
  const auth = inject(Auth);

  const rol = await auth.obtenerRol();

  return rol === 'admin' || rol === 'empleado';
};