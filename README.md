# Portal de técnicos · Agronomía Inteligente

Formulario móvil de instalación con acceso por código, fotos, firma, guardado en servidor y PDF. Python 3.12 o posterior, sin dependencias de servidor adicionales.

## Ejecutar localmente

```sh
python3 server.py
```

Abrir `http://127.0.0.1:8001`. En Windows también se puede usar `py server.py`.
El código inicial es **Agro2026!**. Se valida en el servidor y crea una sesión de 12 horas mediante cookie HttpOnly. No usar `python -m http.server`: no ofrece login ni guardado.

1. Ingresar con el código y completar los cuatro pasos.
2. Agregar cámaras, fotos y firma. El borrador de texto se conserva en ese navegador; **las fotos y la firma no se restauran al recargar**. Mantener la pestaña abierta hasta guardar.
3. Confirmar con oficina y elegir guardar y descargar o enviar por correo.
4. El servidor guarda PDF, fotos JPEG comprimidas (hasta 1600 px) y metadatos en `../instaladores-data/<identificador>/`. `DATA_DIR` permite elegir otra carpeta. No está expuesta como carpeta pública. Límite por solicitud: 32 MB y 120 fotos.

La aplicación requiere conexión al servidor para iniciar sesión y guardar; descarga jsPDF y AutoTable desde jsDelivr. No es una aplicación offline. Compartir un código da acceso al mismo portal: no hay usuarios individuales ni separación por técnico.

## Correo opcional

Configurar estas variables en el proceso del servidor, nunca en JavaScript ni en Git:

- `SMTP_HOST`: servidor de correo.
- `SMTP_PORT`: 587 por defecto; se usa STARTTLS obligatorio y validación TLS.
- `SMTP_FROM`: remitente autorizado.
- `SMTP_USER` y `SMTP_PASSWORD`: autenticación si el proveedor la requiere.

Si SMTP no está configurado o falla, el parte permanece guardado y puede descargarse. Los correos incluyen el PDF adjunto. Las fotos se incluyen en el PDF y también se conservan por separado en el servidor. No se envían mensajes por WhatsApp.

## Llevar al VPS

Ejecutar el mismo servidor detrás de un proxy HTTPS (por ejemplo Nginx), manteniendo el puerto Python en loopback. Configurar `PUBLIC_ORIGIN=https://tu-dominio`, `COOKIE_SECURE=1`, `ACCESS_CODE` (código de acceso) y `DATA_DIR` en almacenamiento persistente con copias de seguridad. `HOST` y `PORT` permiten cambiar la escucha. Dar permisos de escritura únicamente al usuario del servicio sobre DATA_DIR. No exponer esa carpeta en el servidor web. Las sesiones se invalidan al reiniciar el proceso. Ejecutar una sola instancia; para múltiples procesos se necesitará almacenamiento compartido de sesiones y límites de acceso.

La cámara y geolocalización en un celular requieren HTTPS o localhost y permisos del navegador. El VPS, dominio y SMTP aún no están desplegados/configurados.

## Verificaciones

```sh
python3 -m unittest discover -s tests -v
node --check portal.js
```

Las pruebas del servidor usan una carpeta temporal y SMTP simulado: validan acceso, sesión, límite de intentos, rechazo de archivos inválidos, guardado y construcción del correo con adjunto. No prueban la entrega a un proveedor SMTP real.
