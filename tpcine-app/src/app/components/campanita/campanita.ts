import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../services/auth';
import { Notificaciones } from '../../services/notificaciones';

@Component({
  imports: [DatePipe],
  selector: 'app-campanita',
  styleUrl: './campanita.css',
  templateUrl: './campanita.html',
})
export class Campanita implements OnInit, OnDestroy {
  lista = signal<any[]>([]);
  abierta = signal<boolean>(false);

  // La suscripción al realtime: la guardo para poder cerrarla al destruir el componente
  private suscripcion?: Subscription;

  constructor(private auth: Auth, private notificaciones: Notificaciones, private router: Router) {}

  async ngOnInit() {
    const usuario = (await this.auth.getUser()).data.user;
    if (!usuario) {
      return;
    }

    // Pedimos permiso para avisos del navegador 
    // (solo funcionan con la página abierta)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    await this.cargar();

    // Al llegar una fila nueva por Realtime
    // la sumamos arriba de la lista con Signal 
    this.suscripcion = this.notificaciones.getNuevasRealtime(usuario.id).subscribe({
      next: (nueva) => {
        this.lista.set([nueva, ...this.lista()]);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(nueva['titulo'], { body: nueva['mensaje'] });
        }
      },
      error: (error) => console.error('Error de realtime:', error),
    });
  }

  // Al cerrar sesión el navbar destruye la campanita
  // acá se cierra el canal de realtime
  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }

  async cargar() {
    const resultado = await this.notificaciones.getMias();
    this.lista.set(resultado.data || []);
  }

  sinLeer(): number {
    return this.lista().filter((n) => !n['leida']).length;
  }

  alternar() {
    this.abierta.set(!this.abierta());
  }

  // En la base el usuario tiene permiso UPDATE solo sobre
  // la columna "leida" (no puede inventar notificaciones)
  async abrir(n: any) {
    await this.notificaciones.marcarLeida(n['id_notificacion']);
    n['leida'] = true;
    this.lista.set([...this.lista()]);
    this.abierta.set(false);
    if (n['enlace']) {
      this.router.navigateByUrl(n['enlace']);
    }
  }
}