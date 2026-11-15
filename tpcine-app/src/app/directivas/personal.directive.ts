import { Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../services/auth';

@Directive({
  selector: '[appPersonal]',
})
export class PersonalDirective implements OnInit {

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: Auth
  ) {}

  async ngOnInit() {
    const rol = await this.auth.obtenerRol();

    if (rol === 'admin' || rol === 'empleado') {
      this.viewContainer.createEmbeddedView(this.template);
    } else {
      this.viewContainer.clear();
    }
  }
}