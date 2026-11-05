/* Portal: authenticated session, guided form and server-backed delivery. */
(() => {
  const $ = s => document.querySelector(s);
  const sections = [...document.querySelectorAll('#formInstalacion > .section')];
  let step = 0, busy = false, lastReport = null;
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
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    const button = e.target.querySelector('button'); button.disabled = true;
    $('#loginMsg').textContent = '';
    try { await api('/api/login', {code:$('#accessCode').value}); $('#accessCode').value = ''; lock(false); }
    catch (err) { $('#loginMsg').textContent = err.message; }
    finally { button.disabled = false; }
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
  new MutationObserver(invalidate).observe($('#camList'), {childList:true});
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
  async function finish(email) {
    if (busy) return;
    if (!window.validarParte()) {
      showStep($('#formMsg').textContent.includes('Oficina') ? 3 : 1);
      $('#formMsg').scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    if (email && (!$('#reportEmail').value || !$('#reportEmail').checkValidity())) {
      $('#reportEmail').reportValidity(); window.msg('err', 'Ingresá el correo del destinatario.'); return;
    }
    busy = true;
    const controls = [...document.querySelectorAll('#formInstalacion input, #formInstalacion select, #formInstalacion textarea, #formInstalacion button, .steps button, .step-navigation button, #logout')];
    const enabled = controls.filter(el => !el.disabled);
    enabled.forEach(el => el.disabled = true);
    $('#formInstalacion').classList.add('saving');
    window.msg('', email ? 'Guardando y enviando…' : 'Guardando el parte…');
    try {
      const report = await prepare();
      if (email) { await api(`/api/reports/${report.id}/email`, {email:$('#reportEmail').value.trim()}); window.msg('ok', 'Parte guardado y correo enviado.'); }
      else { await window.descargarPDF(report.blob, `parte-instalacion-${$('#fechaInst').value}.pdf`); window.msg('ok', 'Parte guardado. PDF descargado.'); }
    } catch (err) {
      window.msg('err', err.message);
      if (!lastReport) $('#storageStatus').textContent = 'No se confirmó el guardado. Conservá esta pestaña abierta para volver a intentar.';
    } finally { busy = false; enabled.forEach(el => el.disabled = false); $('#formInstalacion').classList.remove('saving'); }
  }
  $('#btnEnviar').onclick = () => finish(false);
  $('#btnEmail').onclick = () => finish(true);
})();
