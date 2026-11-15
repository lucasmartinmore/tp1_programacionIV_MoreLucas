import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';
import { Carrito } from '../../services/carrito';
import { AdminDirective } from '../../directivas/admin.directive';
import { PersonalDirective } from '../../directivas/personal.directive';

@Component({
  imports: [RouterLink, RouterLinkActive, AdminDirective, PersonalDirective],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  constructor(public auth: Auth, public carrito: Carrito, private router: Router) {}

  // true cuando el menu está desplegado 
  // (solo se nota en pantallas chicas)
  menuAbierto = signal<boolean>(false);

  alternarMenu() {
    this.menuAbierto.set(!this.menuAbierto());
  }

  async cerrarSesion() {
    await this.auth.signOut();
    this.carrito.limpiarTodo();
    this.router.navigate(['/peliculas']);
  }
}