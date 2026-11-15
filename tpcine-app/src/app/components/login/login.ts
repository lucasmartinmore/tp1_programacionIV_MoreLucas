import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { LoginData } from '../../models/login-data';
import { Auth } from '../../services/auth';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'El email es obligatorio' });
    email(schemaPath.email, { message: 'Ingresá un email válido' });
    required(schemaPath.password, { message: 'La contraseña es obligatoria' });
  });

  // Pasa a true cuando el usuario aprieta "Ingresar" con datos incompletos:
  // recién ahí se muestran los mensajes de error
  mostrarErrores = signal<boolean>(false);
  errorMensaje = signal<string>('');
  enviando = signal<boolean>(false);

  constructor(private auth: Auth, private router: Router) {}

  async onSubmit(event: Event) {
    event.preventDefault();

    // Si falta algún dato, no sigo y muestro qué falta
    if (this.loginForm().invalid()) {
      this.mostrarErrores.set(true);
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set('');

    const credentials = this.loginModel();
    const result = await this.auth.signIn(credentials.email, credentials.password);
    this.enviando.set(false);

    if (result.error) {
      this.errorMensaje.set('Email o contraseña incorrectos.');
      return;
    }

    this.router.navigate(['/peliculas']);
  }
}