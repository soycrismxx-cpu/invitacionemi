# Los 14 de Emili · Invitación Halloween

Página responsive sin dependencias, sin instalación y sin imágenes externas. Incluye ilustración original en SVG, animación respetuosa de la preferencia de movimiento reducido, cuenta regresiva y RSVP. Fecha: 30 de octubre de 2026 a las 16:00, hora del centro de México (UTC−06:00).

## 1. Ver la invitación

Abre `index.html` con tu navegador. Puedes explorar toda la invitación. Antes de configurar Google, el formulario explica que las confirmaciones aún no están habilitadas: no simula un envío exitoso.

## 2. Preparar Google Sheets

1. Crea una hoja de cálculo en Google Sheets con tu cuenta, por ejemplo «Cumpleaños de Emili · RSVP». Mantén privado el acceso a la hoja.
2. Copia su ID: es la parte entre `/d/` y `/edit` en su dirección. En `https://docs.google.com/spreadsheets/d/ABC123/edit`, el ID sería `ABC123`.
3. Abre **Extensiones → Apps Script** desde la hoja.
4. Reemplaza el contenido de `Code.gs` del editor por el archivo `Code.gs` incluido.
5. Sustituye `PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET` por el ID copiado, conservando las comillas.
6. Guarda. Selecciona la función **setup** y pulsa **Ejecutar**. Autoriza el acceso solicitado para tu propio proyecto. Se creará la pestaña **Confirmaciones**, con encabezados y zona horaria de México.

## 3. Publicar el receptor de confirmaciones

1. En Apps Script, elige **Implementar → Nueva implementación**.
2. En el icono de engrane selecciona **Aplicación web**.
3. En **Ejecutar como**, selecciona **Yo** (la persona propietaria de la hoja).
4. En **Quién tiene acceso**, selecciona **Cualquier usuario** / **Anyone**, para permitir invitados sin sesión de Google. Algunas cuentas de escuela o empresa no permiten esta opción; en ese caso utiliza una cuenta que sí la permita.
5. Pulsa **Implementar** y copia la URL de la aplicación web, terminada en `/exec` (no uses `/dev`).
6. Abre `config.js` con un editor de texto. Pega esa URL entre las comillas de `rsvpEndpoint` y guarda.

Ejemplo:

```js
window.INVITATION_CONFIG = {
  rsvpEndpoint: "https://script.google.com/macros/s/TU_IMPLEMENTACION/exec",
  eventDate: "2026-10-30T16:00:00-06:00"
};
```

La URL es pública por diseño; el ID de la hoja solo está en Apps Script. No publiques el archivo `Code.gs` junto con el sitio ni compartas públicamente tu hoja.

## 4. Compartir la página

Publica **index.html**, **styles.css**, **app.js** y **config.js**, juntos en la misma carpeta, en cualquier alojamiento de sitios estáticos con HTTPS. Comparte la URL del sitio con tus invitados. El ZIP completo es para ti; no hace falta subir el README ni Code.gs al sitio. La dirección del evento será visible para quien tenga acceso al enlace, así que compártelo con tus invitados de forma privada.

## 5. Hacer una prueba real

1. Abre la página publicada desde tu celular o una ventana privada.
2. Envía una prueba con «Sí» y 2 personas; comprueba la nueva fila en **Confirmaciones**.
3. Envía otra con «No»: debe guardar 0 personas.
4. Verifica nombre, mensaje y fecha/hora. Borra únicamente las filas de prueba.
5. Abre Maps y comprueba que el punto corresponde al lugar. La invitación utiliza el enlace compartido por la persona organizadora: https://maps.app.goo.gl/P7bQBdXqPARnSrqt6.

La conexión real requiere tu propia cuenta y despliegue; no viene desplegada. Solo se muestra «Respuesta guardada» tras leer `{ "ok": true }` del servidor. No se usa `no-cors`, pues daría una respuesta que el navegador no puede verificar. Se envía un POST con campos codificados como formulario, sin encabezados personalizados.

## Consultar quién viene

Cada fila contiene timestamp del servidor, nombre, Sí/No, número de personas (incluye al invitado), mensaje y un ID de envío. En Google Sheets usa **Datos → Crear un filtro** para filtrar la columna **Asistirá**. Para contar personas confirmadas, suma la columna D: `=SUM(D2:D)` o `=SUMA(D2:D)` según el idioma de tu hoja. Los «No» siempre aportan 0.

Un reintento con los mismos datos en la misma página usa el mismo ID y no vuelve a agregar una fila. Una recarga o un cambio de respuesta constituye otro envío; no se identifican personas de forma única por nombre. Si alguien corrige su asistencia, conserva manualmente su respuesta más reciente y elimina la anterior antes de sumar. No se guardan datos personales en el almacenamiento del navegador.

## Si algo falla

- **Confirmaciones no habilitadas:** revisa `rsvpEndpoint` y que termine en `/exec`.
- **No se pudo verificar:** revisa Internet, permisos de la implementación y la URL. El registro podría haberse guardado aunque la respuesta no llegara; reintenta sin recargar ni cambiar datos para reutilizar el ID, o comprueba la hoja.
- **No se pudo guardar:** revisa el ID de la hoja, ejecuta `setup` y consulta **Ejecuciones** en Apps Script.
- **Cambiaste Code.gs:** ve a **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Conserva la URL existente o actualiza `config.js` si creas otra implementación.
- No pruebes `doPost` con el botón Ejecutar; necesita los datos enviados desde el formulario.
- Si tu alojamiento aplica una política CSP, permite conexiones a `https://script.google.com` y `https://*.googleusercontent.com`.

## Personalizar

Textos y dirección: `index.html`. Colores y diseño: `styles.css`. Endpoint y fecha para la cuenta regresiva: `config.js`. Si cambias la fecha, actualiza también los textos visibles de `index.html`. El máximo de 20 personas está en el HTML y en `Code.gs`: actualiza ambos si hace falta.

El receptor valida datos, neutraliza fórmulas en mensajes/nombres y usa bloqueo para envíos simultáneos. Incluye un campo trampa contra bots básicos, pero no es un servicio con autenticación ni protección avanzada contra spam; es apropiado para compartir una invitación entre conocidos. Las cuotas aplicables son las de tu cuenta de Apps Script.

Documentación oficial de Google: https://developers.google.com/apps-script/guides/web y https://developers.google.com/apps-script/guides/content
