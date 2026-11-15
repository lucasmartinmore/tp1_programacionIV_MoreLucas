import { CanDeactivateFn } from '@angular/router';
import { Registro } from '../components/registros/registro';

// Si el usuario empezó a completar el registro y el formulario sigue inválido,
// le pregunta antes de salir (igual que formGuard de la cátedra)
export const formGuard: CanDeactivateFn<Registro> = (component, currentRoute, currentState, nextState) => {
  const empezoACompletar = component.registroModel().nombre_usuario !== '' || component.registroModel().email !== '';

  if (empezoACompletar && component.registroForm().invalid()) {
    return confirm('El formulario no está completo. ¿Querés salir de todos modos?');
  }
  return true;
};