import { Component, OnInit, signal } from '@angular/core';
import { Pelicula } from '../../models/pelicula';
import { Peliculas } from '../../services/peliculas';
import { Alertas } from '../../services/alertas';
import { Auth } from '../../services/auth';


@Component({
  selector: 'app-proximamente',
  standalone: true,
  imports: [],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.css'
})
export class Proximamente implements OnInit {
  peliculasProximas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);
  private temporizador: any;

  // ids de las películas en las
  //  que ya tengo alerta activada
  idsConAlerta = signal<string[]>([]);
  mensaje = signal<string>('');

  constructor(
    private peliculasService: Peliculas,
    private alertasService: Alertas,
    private auth: Auth
  ) {}

  async ngOnInit() {
    // Primero la base avisa (por la campanita)
    //  si alguna alerta mía ya puede comprarse
    await this.alertasService.procesar();
    await this.cargarEstrenos();
    await this.cargarMisAlertas();
  }

  async cargarEstrenos() {
    this.cargando.set(true);
    const result = await this.peliculasService.getProximosEstrenos();
    this.peliculasProximas.set(result.data || []);
    this.cargando.set(false);
  }

  async cargarMisAlertas() {
    const mias = await this.alertasService.getMias();
    this.idsConAlerta.set((mias.data || []).map((a: any) => a['pelicula_id']));
  }

  tieneAlerta(idPelicula?: string): boolean {
    return !!idPelicula && this.idsConAlerta().includes(idPelicula);
  }

  // Muestra un aviso flotante 
  // y lo borra solo a los 4 segundos
  avisar(texto: string) {
    this.mensaje.set(texto);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.mensaje.set(''), 4000);
  }

  // Activa o desactiva la alerta 
  // (reemplaza al alert() del navegador)
  async alternarAlerta(peli: Pelicula) {
    this.avisar;

    const usuario = (await this.auth.getUser()).data.user;
    if (!usuario) {
      this.mensaje.set('Iniciá sesión para activar alertas.');
      return;
    }
    if (!peli.id_pelicula) {
      return;
    }

    if (this.tieneAlerta(peli.id_pelicula)) {
      await this.alertasService.desactivar(peli.id_pelicula);
      this.idsConAlerta.set(this.idsConAlerta().filter(id => id !== peli.id_pelicula));
      this.mensaje.set('Alerta desactivada para "' + peli.titulo_de_pelicula + '".');
      return;
    }

    const resultado = await this.alertasService.activar(peli.id_pelicula);

    // 23505 = ya la tenía activada 
    // (clave única usuario + película)
    if (resultado.error && resultado.error.code !== '23505') {
      this.mensaje.set('No se pudo activar la alerta.');
      return;
    }

    this.idsConAlerta.set([...this.idsConAlerta(), peli.id_pelicula]);
    this.mensaje.set('Listo: te avisamos en la campanita cuando abra la venta de "' + peli.titulo_de_pelicula + '".');
  }
}