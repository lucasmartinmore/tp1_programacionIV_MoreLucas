import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PermisoDirective } from '../../directivas/permiso.directive';
import { Permisos } from '../../services/permisos';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, PermisoDirective],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  private permisos = inject(Permisos);
  private router = inject(Router);

  private todas = ['peliculas', 'funciones', 'productos', 'cupones', 'recompensas', 'propuestas', 'reportes', 'roles'];

  ngOnInit() {
    if (this.router.url === '/admin') {
      const primera = this.todas.find(s => this.permisos.tiene(s));
      if (primera) {
        this.router.navigate(['/admin', primera]);
      }
    }
  }
}