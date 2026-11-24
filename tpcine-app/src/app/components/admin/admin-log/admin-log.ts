import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Log } from '../../../services/log';

@Component({
  imports: [DatePipe],
  selector: 'app-admin-log',
  styleUrl: './admin-log.css',
  templateUrl: './admin-log.html',
})
export class AdminLog implements OnInit {
  registros = signal<any[]>([]);
  cargando = signal<boolean>(true);

  constructor(private logService: Log) {}

  async ngOnInit() {
    const resultado = await this.logService.getUltimos();
    this.registros.set(resultado.data || []);
    this.cargando.set(false);
  }
}