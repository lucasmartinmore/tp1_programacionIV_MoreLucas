import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Comprobantes } from '../../services/comprobantes';
import { Compras } from '../../services/compras';
import { Recompensas } from '../../services/recompensas';
import { ListaEspera } from '../../services/lista-espera';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  perfil = signal<any>(null);
  canjes = signal<any[]>([]);
  compras = signal<any[]>([]);                 // mis compras
  listasEspera = signal<any[]>([]);            // Lista de espera activa
  mensaje = signal<string>('');                // resultado de cancelar
  // Imágenes QR de los canjes de candy sin usar
  // la clave es el código del canje
  qrs = signal<Record<string, string>>({});

  constructor(
    public auth: Auth,
    private recompensasService: Recompensas,
    private comprasService: Compras,
    private comprobantes: Comprobantes,
    private esperaService: ListaEspera
  ) {}

  async ngOnInit() {
    await this.cargar();
  }

  // Trae todo lo del perfil 
  // (se vuelve a llamar despues de cancelar para actualizar saldos)
  async cargar() {
    const resultadoUsuario = await this.auth.getUser();
    const usuario = resultadoUsuario.data.user;
    if (!usuario) {
      return;
    }

    const resultadoPerfil = await this.auth.getPerfil(usuario.id);
    this.perfil.set(resultadoPerfil.data);

    const resultadoCompras = await this.comprasService.getMisCompras(usuario.id);
    this.compras.set(resultadoCompras.data || []);

    const resultadoCanjes = await this.recompensasService.getMisCanjes(usuario.id);
    this.canjes.set(resultadoCanjes.data || []);

    const resultadoEspera = await this.esperaService.misListas(usuario.id);
    this.listasEspera.set(resultadoEspera.data || []);

    // El QR de candy lleva el prefijo "CANJE" 
    // para que el validador lo reconozca
    const mapa: Record<string, string> = {};
    for (const canje of this.canjes()) {
      if (canje['tipo'] === 'CANDY' && !canje['usado']) {
        mapa[canje['codigo']] = await this.comprobantes.generarQr('CANJE:' + canje['codigo']);
      }
    }
    this.qrs.set(mapa);
  }

  // La funcion de la compra (película, sala y hora)
  // sale de su primera entrada
  funcionDe(compra: any): any {
    const entradas = compra['entradas'] || [];
    return entradas.length > 0 ? entradas[0]['funciones'] : null;
  }

  // Solo se puede cancelar si esta completada y faltan mas de 2 horas para la funcion
  // Es para mostrar u ocultar el btn; la regla real la vuelve a validar la base
  puedeCancelar(compra: any): boolean {
    if (compra['estado_de_compra'] !== 'COMPLETADA') {
      return false;
    }

    const funcion = this.funcionDe(compra);
    if (!funcion) {
      return false;
    }

    const inicio = new Date(funcion['fecha_hora_inicio']).getTime();
    const dosHoras = 2 * 60 * 60 * 1000;
    return Date.now() < inicio - dosHoras;
  }

  // NUEVO
  async cancelar(compra: any) {
    this.mensaje.set('');

    if (!confirm('¿Cancelar esta compra? No se devuelve dinero: se te acredita saldo en tu cuenta.')) {
      return;
    }

    const funcion = this.funcionDe(compra);
    const resultado = await this.comprasService.cancelarConCredito(compra['id_compra_entrada']);

    if (resultado.error) {
      // El mensaje viene de los "raise exception"
      // de la función de la base
      this.mensaje.set(resultado.error.message);
      return;
    }

    // Si había alguien en lista de espera para esta función
    // le avisa con ventana de 15 min
    if (funcion?.['id_funcion']) {
      await this.esperaService.avanzarCola(funcion['id_funcion']);
    }

    this.mensaje.set('Compra cancelada. Se acreditaron $' + resultado.data + ' a tu crédito.');
    await this.cargar();
  }

  async salirEspera(idEspera: number) {
    await this.esperaService.salir(idEspera);
    await this.cargar();
  }
}