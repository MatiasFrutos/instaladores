/* Portal: authenticated session, guided form and server-backed delivery. */
(() => {
  const $ = s => document.querySelector(s);
  const sections = [...document.querySelectorAll('#formInstalacion > .section')];
  let step = 0, busy = false, lastReport = null;
  // Visible instructions, also linked to controls for screen readers.
  const fieldHelp = {
    cliNombre: 'Nombre de la persona o empresa para la que realizaste la visita.',
    cliTel: 'Número de contacto del cliente, con código de área.',
    cliDireccion: 'Lugar de instalación: calle y número, nombre del campo o referencia de acceso.',
    cliCiudad: 'Localidad y provincia donde está la instalación.',
    tecNombre: 'Tu nombre y apellido: sos la persona responsable de este parte.',
    fechaInst: 'Día en que hiciste el trabajo. Cambialo si estás registrando una visita anterior.',
    obs: 'Contá qué hiciste, qué problema encontraste y si queda algo pendiente. Máximo 800 caracteres.',
    okCableado: 'Marcá si revisaste que los cables y las conexiones estén firmes y en buen estado.',
    okMontura: 'Marcá si comprobaste que el soporte y las fijaciones de la cámara estén firmes.',
    okCotorra: 'Marcá si verificaste la protección de cables y equipos contra daños de cotorras.',
    confOficina: 'Obligatorio para cerrar: marcá solo cuando alguien de oficina te confirme que ve las cámaras remotamente.',
    validador: 'Nombre y apellido de quien, desde oficina, te confirmó que puede ver las cámaras. No es el nombre del técnico en campo.',
    horaConf: 'Hora local en la que esa persona de oficina te dio la confirmación.',
    accessCode: 'Usá el código de acceso compartido con tu equipo. No necesitás usuario ni correo.',
    tipo: 'Obligatorio: elegí si instalaste una cámara o hiciste soporte, y si el equipo es nuevo o ya estaba instalado.',
    estructura: 'Elegí dónde quedó fijada la cámara: torre, poste, columna o techo.',
    chkUbic: 'Marcá si confirmaste el punto físico donde debe instalarse o revisarse esta cámara.',
    chkSat: 'Marcá si revisaste ese punto en un mapa con imagen satelital.',
    chkHerr: 'Marcá si contaste con las herramientas necesarias para realizar el trabajo.',
    modelo: 'Elegí el modelo que figura en la etiqueta o en la configuración de esta cámara.',
    serie: 'Copiá el identificador único o número de serie de la etiqueta del equipo.',
    conexion: 'Indica cómo recibe energía: panel solar o red eléctrica de 220 V. No es el tipo de conexión a internet.',
    modem: 'Marca y modelo del equipo que da internet a esta cámara. Si no tiene módem, marcá “No aplica”.',
    operador: 'Empresa de la tarjeta SIM que usa el módem para conectarse a internet.',
    rssi: 'Valor de señal celular mostrado por el módem, en dBm. Ejemplo: -75. Copiá la medición sin convertirla.',
    vel: 'Resultado de la prueba de internet: primero subida, luego bajada, en Mbps. Ejemplo: 3 / 8. Si no corresponde, marcá “No aplica”.',
    radio: 'Valor de señal recibido que muestra el equipo de radioenlace, en dBm. Ejemplo: -60. Si no hay radioenlace, marcá “No aplica”.',
    volt: 'Voltaje medido en la alimentación del equipo, en voltios. Ejemplo: 12.0. No copies 220 solo por haber elegido red eléctrica; registrá la medición correspondiente.',
    latGms: 'Coordenada norte/sur del lugar de esta cámara, en grados, minutos y segundos. “Usar mi ubicación” la completa con la posición de tu dispositivo.',
    lonGms: 'Coordenada este/oeste del mismo punto. Verificá que estés junto a la cámara antes de usar la ubicación del dispositivo.',
    t_vivo: 'Marcá si pudiste abrir la imagen en vivo y comprobar que se ve correctamente.',
    t_noti: 'Marcá si comprobaste que las notificaciones llegan a la aplicación del cliente.',
    t_sd: 'Marcá si comprobaste que la tarjeta microSD graba y permite ver una grabación.',
    t_evt: 'Marcá si hiciste una prueba de movimiento y el equipo registró el evento.',
    t_panel: 'Marcá si verificaste que el panel solar está entregando carga al sistema.',
    Poste: 'Foto del poste o estructura donde está montada esta cámara.',
    Vivo: 'Foto o captura de la imagen en vivo de esta cámara en la aplicación.',
    Carga: 'Foto de la lectura o indicador de carga del sistema solar.',
    Fij: 'Foto desde atrás donde se distingan las fijaciones de la cámara al poste.',
    Senal: 'Foto o captura donde se lea el nivel de señal de esta conexión.',
    CamPoste: 'Foto desde lejos que muestre la cámara, el poste completo y su entorno.',
  };
  function explainFields() {
    document.querySelectorAll('input, select, textarea').forEach(control => {
      const original = control.id || control.name;
      if (!original) return;
      const suffix = original.startsWith('cam_') ? original.split('_').slice(2).join('_') : original;
      if (suffix.endsWith('_na')) {
        const field = control.closest('.field');
        control.setAttribute('aria-label', `No aplica: ${field?.querySelector('label')?.textContent.trim() || 'medición'}`);
        return;
      }
      const help = fieldHelp[suffix];
      if (!help) return;
      if (!control.id) control.id = original;
      const hintId = `${control.id}_help`;
      if (document.getElementById(hintId)) return;
      const hint = document.createElement('small'); hint.id = hintId; hint.className = 'field-help'; hint.textContent = help;
      const label = control.closest('.field')?.querySelector('label:not(.na)');
      if (label && !label.contains(control)) label.htmlFor = control.id;
      if (control.type === 'checkbox') control.closest('label').querySelector('span')?.appendChild(hint);
      else if (control.type === 'file') {
        const caption = control.closest('.photo-cell').querySelector('.ph-caption');
        caption.replaceChildren(hint);
      } else control.closest('.field, .code-field')?.appendChild(hint);
      control.setAttribute('aria-describedby', hintId);
    });
  }
  explainFields();

  function showStep(n) {
    step = Math.max(0, Math.min(3, n));
    sections.forEach((el, i) => el.hidden = i !== step);
    document.querySelectorAll('[data-step]').forEach((el, i) => {
      el.classList.toggle('active', i === step);
      if (i === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    $('.delivery').hidden = step !== 3;
    $('.bar__right').hidden = step !== 3;
    $('#prevStep').hidden = step === 0;
    $('#nextStep').hidden = step === 3;
    $('#stepCount').textContent = `Paso ${step + 1} de 4`;
    const activeSection = sections[step];
    activeSection.classList.remove('section-enter');
    void activeSection.offsetWidth;
    activeSection.classList.add('section-enter');
    if (step === 3) window.dispatchEvent(new Event('resize'));
  }
  document.querySelectorAll('[data-step]').forEach(el => el.onclick = () => showStep(Number(el.dataset.step)));
  $('#prevStep').onclick = () => showStep(step - 1);
  $('#nextStep').onclick = () => { showStep(step + 1); $('.steps').scrollIntoView({behavior:'smooth', block:'start'}); };
  document.addEventListener('show-section', e => showStep(sections.indexOf(e.target)));
  showStep(0);
  function lock(locked) {
    document.body.classList.toggle('locked', locked);
    $('.app').inert = locked;
    $('#loginScreen').hidden = !locked;
    if (!locked) window.dispatchEvent(new Event('resize'));
  }
  async function api(path, body) {
    const res = await fetch(path, {method: body === undefined ? 'GET' : 'POST', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)});
    let result;
    try { result = await res.json(); } catch { throw new Error('El servidor no respondió correctamente.'); }
    if (res.status === 401) lock(true);
    if (!res.ok) throw new Error(result.error || 'No se pudo completar la operación.');
    return result;
  }
  $('#toggleCode').onclick = () => {
    const visible = $('#accessCode').type === 'password';
    $('#accessCode').type = visible ? 'text' : 'password';
    $('#toggleCode').setAttribute('aria-label', visible ? 'Ocultar código' : 'Mostrar código');
    $('#toggleCode').setAttribute('aria-pressed', String(visible));
  };
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    const button = e.target.querySelector('[type=submit]'); button.disabled = true;
    button.classList.add('loading');
    $('#loginMsg').textContent = '';
    try { await api('/api/login', {code:$('#accessCode').value}); $('#accessCode').value = ''; lock(false); }
    catch (err) { $('#loginMsg').textContent = err.message; }
    finally { button.disabled = false; button.classList.remove('loading'); }
  };
  $('#logout').onclick = async () => {
    try { await api('/api/logout', {}); lock(true); } catch (err) { window.msg('err', err.message); }
  };
  api('/api/session').then(() => lock(false)).catch(() => lock(true));
  const status = () => { $('#connectionStatus').textContent = navigator.onLine ? 'En línea' : 'Sin conexión'; };
  addEventListener('online', status); addEventListener('offline', status); status();
  const base64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob);
  });
  // Photos stay in memory until saved; do not suggest the local text draft contains files.
  document.addEventListener('change', e => {
    if (!e.target.matches('.foto-labeled')) return;
    const input = e.target, cell = input.closest('.photo-cell');
    let preview = cell.querySelector('.photo-preview');
    if (preview) { URL.revokeObjectURL(preview.src); preview.remove(); }
    if (input.files[0]) {
      preview = document.createElement('img'); preview.className = 'photo-preview';
      preview.alt = input.dataset.caption; preview.src = URL.createObjectURL(input.files[0]); cell.prepend(preview);
      cell.querySelector('label').textContent = 'Cambiar foto';
    }
  });
  function invalidate() { lastReport = null; $('#storageStatus').textContent = 'Cambios pendientes. Las fotos y el PDF se guardan al finalizar.'; }
  $('#formInstalacion').addEventListener('input', invalidate);
  $('#formInstalacion').addEventListener('change', invalidate);
  new MutationObserver(() => { invalidate(); explainFields(); }).observe($('#camList'), {childList:true});
  $('#btnClearFirm').addEventListener('click', invalidate);
  $('#btnReset').addEventListener('click', () => {
    document.querySelectorAll('.photo-preview').forEach(img => { URL.revokeObjectURL(img.src); img.remove(); });
    invalidate(); showStep(0);
  });
  async function prepare() {
    if (lastReport) return lastReport;
    $('#storageStatus').textContent = 'Preparando PDF y fotos…';
    const blob = await window.crearPDF();
    const photos = [];
    for (const input of document.querySelectorAll('.foto-labeled')) {
      if (!input.files[0]) continue;
      const dataURL = await window.readImageAsDataURL(input.files[0], 1600, .85);
      photos.push({caption:input.dataset.caption, camera:input.closest('.cam-card').dataset.cam, data:dataURL.split(',')[1]});
    }
    $('#storageStatus').textContent = `Guardando ${photos.length} fotos y PDF en el servidor…`;
    const saved = await api('/api/reports', {pdf: await base64(blob), photos, metadata:window.datosParte()});
    lastReport = {id:saved.id, blob};
    $('#storageStatus').textContent = `Parte guardado · ${saved.photos} fotos respaldadas en el servidor.`;
    return lastReport;
  }
  async function finish() {
    if (busy) return;
    if (!window.validarParte()) {
      showStep($('#formMsg').textContent.includes('Oficina') ? 3 : 1);
      $('#formMsg').scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    busy = true;
    const controls = [...document.querySelectorAll('#formInstalacion input, #formInstalacion select, #formInstalacion textarea, #formInstalacion button, .steps button, .step-navigation button, #logout')];
    const enabled = controls.filter(el => !el.disabled);
    enabled.forEach(el => el.disabled = true);
    $('#formInstalacion').classList.add('saving');
    window.msg('', 'Guardando el parte…');
    try {
      const report = await prepare();
      await window.descargarPDF(report.blob, `parte-instalacion-${$('#fechaInst').value}.pdf`);
      window.msg('ok', 'Parte guardado en el servidor. PDF descargado.');
    } catch (err) {
      window.msg('err', err.message);
      if (!lastReport) $('#storageStatus').textContent = 'No se confirmó el guardado. Conservá esta pestaña abierta para volver a intentar.';
    } finally { busy = false; enabled.forEach(el => el.disabled = false); $('#formInstalacion').classList.remove('saving'); }
  }
  $('#btnEnviar').onclick = () => finish();
})();
