import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Recompensas } from '../../services/recompensas';

@Component({
  imports: [RouterLink],
  selector: 'app-club-puntos',
  styleUrl: './club-puntos.css',
  templateUrl: './club-puntos.html',
})
export class ClubPuntos implements OnInit {
  puntos = signal<number>(0);
  recompensas = signal<any[]>([]);
  mensaje = signal<string>('');

  constructor(private auth: Auth, private recompensasService: Recompensas) {}

  async ngOnInit() {
    await this.cargar();
  }

  // Trae mis puntos y las recompensas disponibles
  async cargar() {
    const resultadoUsuario = await this.auth.getUser();
    const usuario = resultadoUsuario.data.user;

    if (usuario) {
      const perfil = await this.auth.getPerfil(usuario.id);
      this.puntos.set(perfil.data?.['puntos_acumulados'] ?? 0);
    }

    const resultado = await this.recompensasService.getRecompensasActivas();
    this.recompensas.set(resultado.data || []);
  }

  async canjear(recompensa: any) {
    this.mensaje.set('');

    if (!confirm('¿Canjear "' + recompensa['nombre'] + '" por ' + recompensa['costo_puntos'] + ' puntos?')) {
      return;
    }

    const resultado = await this.recompensasService.canjear(recompensa['id']);

    if (resultado.error) {
      // El mensaje viene de los "raise exception" de la función de la base
      this.mensaje.set(resultado.error.message);
      return;
    }

    this.mensaje.set('¡Canje realizado! Lo ves en tu perfil.');
    await this.cargar();      // actualizo el saldo en pantalla
  }
}