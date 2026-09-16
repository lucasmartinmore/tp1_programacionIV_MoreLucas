import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Peliculas } from '../../services/peliculas';

@Component({
  selector: 'app-proximamente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.css'
})
export class Proximamente implements OnInit {
  peliculasProximas: any[] = [];
  cargando: boolean = true;

  constructor(
    private peliculasService: Peliculas,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstrenos();
  }

  async cargarEstrenos(): Promise<void> {
    this.cargando = true;

    try {
      const { data, error } = await this.peliculasService.getProximosEstrenos();

      if (error) {
        console.error('Error reportado por Supabase:', error.message);
      } else {
        this.peliculasProximas = data || [];
      }
    } catch (err: any) {
      console.error('Error inesperado:', err);
    } finally {
      this.cargando = false;
      // Notifica a Angular que actualice el DOM de inmediato
      this.cd.detectChanges();
    }
  }

  activarAlerta(titulo: string): void {
    alert(`¡Alerta activada para "${titulo}"! Te avisaremos cuando abra la preventa.`);
  }
}