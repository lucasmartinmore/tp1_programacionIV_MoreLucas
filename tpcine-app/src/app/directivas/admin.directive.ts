import { Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Auth } from '../services/auth';

@Directive({
  selector: '[appAdmin]',
})
export class AdminDirective implements OnInit {

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: Auth
  ) {}

  async ngOnInit() {
    const rol = await this.auth.obtenerRol();

    if (rol === 'admin') {
      this.viewContainer.createEmbeddedView(this.template);
    } else {
      this.viewContainer.clear();
    }
  }
}