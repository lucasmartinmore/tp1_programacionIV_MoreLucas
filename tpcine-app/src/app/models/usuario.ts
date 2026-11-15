// Datos que van a mi tabla "usuarios" (no a Supabase Auth)
export interface DatosRegistro {
  nombre_usuario: string;
  apellido_usuario: string;
  fecha_de_nacimiento: string;
  tipo_de_sangre: string;
  color_de_ojos: string;
  dias_de_vacaciones: number;
}

// Todo lo que carga el formulario de registro: email y contraseña (Auth) + los datos de arriba
export interface RegistroData extends DatosRegistro {
  email: string;
  password: string;
}