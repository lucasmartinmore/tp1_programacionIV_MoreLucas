# Cinemore — Documento de requerimientos

**Materia:** Programación IV — UTN
**Alumno:** Lucas More Martín
**Proyecto:** Sistema de gestión y venta de entradas para CineMore (Angular + Supabase)

---

## 1. Introducción

El cliente ("Empresario Importante") pidió un sistema para que su cine venda entradas desde su propia página. Los pedidos llegaron en varios mails, con cambios en el camino, así que acá los agrupé por tema. Para cada uno aclaro **qué pide**, **cómo lo resolví** y **dónde se ve** en la app. Al final está la lista de lo que decidí no hacer y por qué.

El cine es un solo edificio con varias salas. Hay cuatro tipos de personas que usan el sistema: **visitante** (sin cuenta), **cliente** (registrado), **empleado** y **administrador**.

---

## 2. Requerimientos de la primera parte

### 2.1 Películas, salas y funciones

| # | Qué pide el cliente | Cómo lo resolví | Dónde |
|---|---|---|---|
| R1 | Cada película tiene nombre, imagen, sinopsis y duración | Tabla `peliculas` con ABM del admin | Admin → Películas |
| R2 | Poder elegir qué películas aparecen y en qué horarios | Campo `esta_en_cartelera` y tabla `funciones` | Admin → Películas / Funciones |
| R3 | Formato 2D, 3D, 4D o 5D, y castellano o subtitulada | Campos `formato_funcion` e `idioma_funcion` en cada función | Admin → Funciones |
| R4 | Salas de 20 filas (letras) con 3 columnas de 4, 20 y 4 butacas | Tabla `butacas` por sala; la sala se dibuja agrupando por fila | Sala |
| R5 | Se quitan las filas J y K y queda una fila accesible de 2, 10 y 2 | Solo queda la fila J, con tipo `ACCESIBLE` y pasillos distintos | Sala |
| R6 | Butacas VIP en las filas R, S y T, con precio mayor y color distinto | Tipo `VIP` con un recargo sobre el precio base, aviso en el checkout | Sala / Checkout |
| R7 | Butacas en tiempo real | Supabase Realtime sobre la tabla `entradas` | Sala |
| R8 | No puede haber dos funciones a la vez en una sala, y debe pasar media hora entre una y otra | Al programar, se prueban las salas y se descartan las que tienen otra función a menos de 30 min | Admin → Funciones |
| R9 | Asignación de salas automática (ej: lunes, martes y viernes a las 18) | El admin elige película, días y hora, y el sistema asigna la sala libre | Admin → Funciones |

### 2.2 Cartelera, géneros y reseñas

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R10 | Mostrar primero las 3 películas más vendidas | Columna `ventas_totales` actualizada por un trigger; se ordena y se marca con insignia | Cartelera |
| R11 | Buscador en el listado | Pipe propio `filtro` | Cartelera |
| R12 | El buscador filtra por género; cada película puede tener varios | Tablas `generos` y `peliculas_generos` (muchos a muchos) y botones de género | Cartelera |
| R13 | Reseñas con estrellas y comentario corto, visibles antes de comprar | Tabla `resenas` y componente `ResenasPelicula` en la pantalla de funciones | Funciones |
| R14 | Mostrar la puntuación promedio | Se calcula sumando estrellas y dividiendo por la cantidad | Funciones |

### 2.3 Usuarios y descuentos

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R15 | Registro con mail, nombre, apellido, nacimiento, tipo de sangre, color de ojos y días de vacaciones | Supabase Auth guarda mail y contraseña; el resto va a la tabla `usuarios` | Registro |
| R16 | Se puede comprar sin cuenta | Policies de RLS para el rol `anon` | Checkout |
| R17 | Cupón del 20 % en la primera compra, con porcentaje configurable | Tabla `cupones` editable por el admin | Checkout / Admin → Cupones |
| R18 | Cupones para mayores de 50 años | Cupón `MAYORES_50`; se calcula la edad con la fecha de nacimiento; si le corresponden dos, se aplica el mayor | Checkout |
| R19 | Restricción de edad (+13 y +18): menores no compran, y la entrada aclara que debe ir un adulto | El checkout bloquea el pago según la edad; el ticket agrega la aclaración | Checkout / Ticket |

### 2.4 Candy bar y combos

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R20 | Crear productos con categorías y comprarlos junto con la entrada | Tabla `productos_candy` y detalle en `compras_candy`; categoría como texto con sugerencias | Candy / Admin → Productos |
| R21 | Retirar la comida con el mismo QR | El ticket genera un QR de candy aparte, validado por el empleado | Ticket / Validador |
| R22 | Combos (entrada + pochoclos + bebida) a precio fijo, destacados | Un combo es un producto con `es_combo`; si incluye entrada, el checkout descuenta la más barata | Candy / Checkout |

### 2.5 Compra, entrada y validación

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R23 | Entrada en PDF con los datos y un QR | `qrcode` genera el QR y `jspdf` arma el PDF | Ticket |
| R24 | Empleados validan los QR; también se puede cargar el código a mano | Campo de texto que sirve para escribir o para un lector USB | Empleado → Validar |
| R25 | Una vez validada la entrada o entregada la comida, el QR deja de servir | Un solo `update` condicionado a `entrada_validada = false` | Validador |
| R26 | Cancelar hasta 2 horas antes, con crédito | Función `cancelar_compra` que valida las 2 horas, libera butacas y acredita | Perfil |
| R27 | El crédito aparece en el perfil y se usa junto con otros métodos de pago | Se aplica primero el crédito y el resto se paga normal | Perfil / Checkout |

### 2.6 Fidelización, próximamente y preventa

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R28 | 1 punto por peso gastado (solo registrados) | Trigger en la base | Perfil |
| R29 | Canje de puntos por entradas o productos, con costo configurable por el admin | Tabla `recompensas`, función `canjear_recompensa` y entrada gratis aplicada en el checkout | Club de puntos / Admin |
| R30 | Ver puntos e historial de canjes; no se transfieren | Perfil con la tabla `canjes`; los puntos solo cambian dentro de funciones de la base | Perfil |
| R31 | Sección "Próximamente" con alerta para avisar cuando abra la venta | Tabla `alertas_estreno` y aviso por la campanita | Próximamente |
| R32 | Preventa 7 días antes del estreno, con precio especial por película | Campo `descuento_preventa`; el estado sale de comparar la fecha de hoy con la del estreno | Cartelera / Checkout |
| R33 | "Mis películas": historial visual con póster, fecha y calificación | Se arma desde compras y reseñas, sin tabla nueva | Mis películas |

### 2.7 Administración y reportes

| # | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|
| R34 | Un usuario administrador controla salas, funciones, butacas y productos | Rol `admin` con guard y policies de RLS | Admin |
| R35 | Reporte de facturación por día y entradas vendidas | Agrupación por día con total y cantidad | Admin → Reportes |
| R36 | Exportar el reporte a PDF y Excel | PDF con `jspdf` y CSV que Excel abre directo | Admin → Reportes |
| R37 | Gráfico de películas más vistas por semana y mes, y producto más vendido | Barras hechas con HTML y CSS, sin librería | Admin → Gráficos |
| R38 | Log de actividad: quién creó una función, quién cambió un precio, quién validó un QR, con fecha y hora | Tabla `log_actividad` llenada por triggers | Admin → Log |
| R39 | Interfaces fáciles, con poco scroll y mejor ingreso de fechas y horas | Hora con lista de a 30 minutos, días con botones y diseño adaptado a celular | Todo el sistema |

---

## 3. Agregados del recuperatorio

| # | Agregado | Qué pide | Cómo lo resolví | Dónde |
|---|---|---|---|---|
| A1 | Propuestas de películas | El cliente propone una película (una pendiente a la vez); el admin la acepta, y se abre el formulario con los datos cargados, o la rechaza | Tabla `propuestas_peliculas` con índice único parcial, y `resolver_propuesta` | Proponer / Admin → Propuestas |
| A2 | Roles configurables | El admin crea roles con permisos por sección y los asigna | Tabla `roles` con lista de secciones, `tiene_permiso()` en las policies, `permisoGuard` y `*appPermiso` | Admin → Roles |
| A3 | Cancelación de función | Crédito a todos los compradores, butacas liberadas, aviso y reubicación, todo atómico | Función `cancelar_funcion` (una transacción) con `for update` | Admin → Funciones |
| A4 | Lista de espera | Si la función está agotada, anotarse; al liberarse un lugar, 15 minutos para comprar; posición en el perfil y conteo en el admin | Tabla `lista_espera`, `procesar_espera` y dos triggers | Sala / Perfil / Admin |
| A5 | Notificaciones | Avisos dentro de la app en tiempo real y del navegador con la página abierta | Tabla `notificaciones`, función `notificar`, Realtime y la campanita | Navbar |

---

## 4. Reglas de negocio importantes

1. Una butaca no se puede vender dos veces para la misma función (restricción única en la base).
2. Entre dos funciones de una sala hay al menos 30 minutos.
3. Una entrada o un retiro de candy se usa una sola vez.
4. Se cancela una compra solo hasta 2 horas antes; no se devuelve dinero, se acredita crédito.
5. Los puntos, el crédito y los totales no pueden modificarse desde el navegador.
6. Un cliente solo puede tener una propuesta de película pendiente.
7. Un lugar liberado queda reservado 15 minutos para el primero de la lista de espera.
8. Si a un usuario le corresponden dos cupones, se aplica el de mayor porcentaje.
9. La preventa solo vale desde 7 días antes del estreno hasta el estreno.

---

## 5. Requisitos no funcionales

* **Tecnología:** Angular 22 con componentes standalone, signals y Signal Forms; Supabase (PostgreSQL, Auth y Realtime).
* **Seguridad:** RLS en todas las tablas. Las reglas importantes viven en la base (policies, triggers y funciones), porque la interfaz se puede manipular.
* **PWA:** manifest y service worker, instalable desde el navegador.
* **Diseño:** estilo retro-cinema propio, adaptado a celular.
* **Entrega:** aplicación desplegada en Vercel, código en GitHub y README con arquitectura y decisiones.

---

### Simplificaciones que decidí

* La validación de edad y la ventana de preventa se controlan en la interfaz. Con más tiempo las movería a la base.
* La ventana de 15 minutos de la lista de espera y las alertas de Próximamente se evalúan cuando alguien consulta. 
* Algunas confirmaciones usan `confirm()` del navegador en vez de un modal propio.