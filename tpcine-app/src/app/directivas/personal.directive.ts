import { Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../services/auth';
import { Permisos } from '../services/permisos';

@Directive({
  selector: '[appPersonal]',
})
export class PersonalDirective implements OnInit {

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: Auth,
    private permisos: Permisos
  ) {}

  async ngOnInit() {
    const rol = await this.auth.obtenerRol();

    if (rol === 'admin' || rol === 'empleado' || this.permisos.tieneAlguno()) {
      this.viewContainer.createEmbeddedView(this.template);
    } else {
      this.viewContainer.clear();
    }
  }
}