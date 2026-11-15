import { Component, signal } from '@angular/core';
import { email, form, FormField, min, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { RegistroData } from '../../models/usuario';
import { Auth } from '../../services/auth';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  registroModel = signal<RegistroData>({
    email: '',
    password: '',
    nombre_usuario: '',
    apellido_usuario: '',
    fecha_de_nacimiento: '',
    tipo_de_sangre: '',
    color_de_ojos: '',
    dias_de_vacaciones: 0,
  });

  registroForm = form(this.registroModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El email es obligatorio' });
    email(schemaPath.email, { message: 'Ingresá un email válido' });
    required(schemaPath.password, { message: 'La contraseña es obligatoria' });
    minLength(schemaPath.password, 6, { message: 'Mínimo 6 caracteres' });
    required(schemaPath.nombre_usuario, { message: 'El nombre es obligatorio' });
    required(schemaPath.apellido_usuario, { message: 'El apellido es obligatorio' });
    required(schemaPath.fecha_de_nacimiento, { message: 'La fecha de nacimiento es obligatoria' });
    required(schemaPath.tipo_de_sangre, { message: 'Elegí un tipo de sangre' });
    required(schemaPath.color_de_ojos, { message: 'El color de ojos es obligatorio' });
    min(schemaPath.dias_de_vacaciones, 0, { message: 'No puede ser negativo' });
  });

  mostrarErrores = signal<boolean>(false);
  errorMensaje = signal<string>('');
  enviando = signal<boolean>(false);

  constructor(private auth: Auth, private router: Router) {}

  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.registroForm().invalid()) {
      this.mostrarErrores.set(true);
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set('');

    const datos = this.registroModel();

    // Paso 1: creo el usuario en Supabase Auth (email + contraseña)
    const resultadoAuth = await this.auth.signUp(datos.email, datos.password);

    if (resultadoAuth.error || !resultadoAuth.data.user) {
      this.errorMensaje.set(resultadoAuth.error?.message || 'No se pudo crear la cuenta.');
      this.enviando.set(false);
      return;
    }

    // Paso 2: guardo el resto de los datos en mi tabla "usuarios", con el mismo id
    const resultadoPerfil = await this.auth.crearPerfilUsuario(resultadoAuth.data.user.id, {
      nombre_usuario: datos.nombre_usuario,
      apellido_usuario: datos.apellido_usuario,
      fecha_de_nacimiento: datos.fecha_de_nacimiento,
      tipo_de_sangre: datos.tipo_de_sangre,
      color_de_ojos: datos.color_de_ojos,
      dias_de_vacaciones: datos.dias_de_vacaciones,
    });

    this.enviando.set(false);

    if (resultadoPerfil.error) {
      console.error('Error al guardar el perfil:', resultadoPerfil.error);
      this.errorMensaje.set('La cuenta se creó, pero hubo un problema guardando tus datos.');
      return;
    }

    this.router.navigate(['/peliculas']);
  }
}