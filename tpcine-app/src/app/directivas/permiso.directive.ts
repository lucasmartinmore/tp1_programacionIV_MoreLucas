import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Permisos } from '../services/permisos';

@Directive({
  selector: '[appPermiso]',
})
export class PermisoDirective {
  private plantilla = inject(TemplateRef);
  private contenedor = inject(ViewContainerRef);
  private permisos = inject(Permisos);

  appPermiso = input.required<string>();

  constructor() {
    effect(() => {
      this.contenedor.clear();
      if (this.permisos.tiene(this.appPermiso())) {
        this.contenedor.createEmbeddedView(this.plantilla);
      }
    });
  }
}