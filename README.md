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
3. Confirmar con oficina y pulsar **Guardar y descargar PDF**. Primero se confirma el guardado en el servidor y después se descarga una copia al dispositivo.
4. El servidor guarda PDF, fotos JPEG comprimidas (hasta 1600 px) y metadatos en `../instaladores-data/<identificador>/`. `DATA_DIR` permite elegir otra carpeta, por ejemplo `/srv/partes` en el VPS. No está expuesta como carpeta pública. Límite por solicitud: 32 MB y 120 fotos.

El PDF usa encabezados y tablas en escala de grises, numeración y secciones continuas: no reserva una página solo para los datos del cliente. Las fotos se colocan después del cierre, mantienen su proporción y aprovechan el espacio disponible sin reducirse a miniaturas.

La aplicación requiere conexión al servidor para iniciar sesión y guardar; descarga jsPDF y AutoTable desde jsDelivr. No es una aplicación offline. Compartir un código da acceso al mismo portal: no hay usuarios individuales ni separación por técnico.

## Llevar al VPS

Ejecutar el mismo servidor detrás de un proxy HTTPS (por ejemplo Nginx), manteniendo el puerto Python en loopback. Configurar `PUBLIC_ORIGIN=https://tu-dominio`, `COOKIE_SECURE=1`, `ACCESS_CODE` (código de acceso) y `DATA_DIR` en almacenamiento persistente con copias de seguridad. `HOST` y `PORT` permiten cambiar la escucha. Dar permisos de escritura únicamente al usuario del servicio sobre DATA_DIR. No exponer esa carpeta en el servidor web. Las sesiones se invalidan al reiniciar el proceso. Ejecutar una sola instancia; para múltiples procesos se necesitará almacenamiento compartido de sesiones y límites de acceso.

La cámara y geolocalización en un celular requieren HTTPS o localhost y permisos del navegador. El VPS y el dominio aún no están desplegados/configurados.

## Verificaciones

```sh
python3 -m unittest discover -s tests -v
node --check portal.js
```

Las pruebas del servidor usan una carpeta temporal: validan acceso, sesión, límite de intentos, rechazo de archivos inválidos y guardado de PDF y fotos. También verifican que los archivos guardados no estén expuestos públicamente y que la ruta de correo ya no exista.
