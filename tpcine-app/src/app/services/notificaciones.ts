import { Service } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

@Service()
export class Notificaciones {
  private supabase;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  getMias() {
    return this.supabase.from('notificaciones').select('*').order('creada', { ascending: false }).limit(20);
  }

  marcarLeida(id: number) {
    return this.supabase.from('notificaciones').update({ leida: true }).eq('id_notificacion', id);
  }

  // Tiempo real: avisa cada vez que se inserta
  // una notificación para este usuario
  suscribir(idUsuario: string, alRecibir: (n: any) => void) {
    return this.supabase
      .channel('notif-' + idUsuario)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'usuario_id=eq.' + idUsuario },
        (payload) => alRecibir(payload.new))
      .subscribe();
  }

  // Igual que getOcupadasRealtime(): emite cada notificación nueva
  // y cierra el canal al desuscribir
  getNuevasRealtime(idUsuario: string) {
    return new Observable<any>((observer) => {
      const channel = this.supabase
        .channel('notif-' + idUsuario)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'usuario_id=eq.' + idUsuario },
          (payload) => observer.next(payload.new))
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            observer.error(new Error('No se pudo suscribir al canal realtime.'));
          }
        });

      return () => {
        void this.supabase.removeChannel(channel);
      };
    });
  }
}