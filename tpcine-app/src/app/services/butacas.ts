import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Service()
export class ButacasService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Datos de la función: de acá saco en qué sala es y cuánto cuesta la entrada
  getFuncionById(funcionId: string) {
    return this.supabase
      .from('funciones')
      .select('*')
      .eq('id_funcion', funcionId)
      .single();
  }

  // Todas las butacas físicas de una sala
  getButacasDeLaSala(salaId: string) {
    return this.supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila_de_butaca', { ascending: true })
      .order('columna_de_butaca', { ascending: true });
  }

  // Ids de las butacas ya vendidas para ESTA función
  getButacasOcupadasDeLaFuncion(funcionId: string) {
    return this.supabase
      .from('entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId);
  }

  // Igual que getCosasRealtime() de la cátedra: devuelve un Observable que emite la lista
  // de butacas ocupadas una vez al empezar y de nuevo cada vez que cambia la tabla "entradas".
  getOcupadasRealtime(funcionId: string) {
    return new Observable<string[]>((observer) => {
      const emitirOcupadas = async () => {
        const { data, error } = await this.getButacasOcupadasDeLaFuncion(funcionId);
        if (error) {
          observer.error(error);
          return;
        }
        observer.next((data || []).map((e: any) => e['butaca_id']));
      };

      void emitirOcupadas();

      const channel = this.supabase
        .channel('entradas-realtime-' + funcionId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'entradas' },
          () => {
            void emitirOcupadas();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            observer.error(new Error('No se pudo suscribir al canal realtime.'));
          }
        });

      // Esto se ejecuta cuando el componente hace unsubscribe(): cierra el canal
      return () => {
        void this.supabase.removeChannel(channel);
      };
    });
  }
}