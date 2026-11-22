import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Propuestas } from '../../../services/propuestas';

@Component({
  selector: 'app-admin-propuestas',
  styleUrl: './admin-propuestas.css',
  templateUrl: './admin-propuestas.html',
})
export class AdminPropuestas implements OnInit {
  lista = signal<any[]>([]);

  constructor(private propuestas: Propuestas, private router: Router) {}

  async ngOnInit() {
    this.lista.set((await this.propuestas.getPendientes()).data || []);
  }

  // Aceptar: marca aceptada y abre el formulario
  // de película con los datos precargados
  async aceptar(p: any) {
    await this.propuestas.resolver(p.id_propuesta, true);
    this.router.navigate(['/admin/peliculas/nueva'], {
      queryParams: { titulo: p.titulo, sinopsis: p.sinopsis },
    });
  }

  async rechazar(p: any) {
    await this.propuestas.resolver(p.id_propuesta, false);
    await this.ngOnInit();
  }
}