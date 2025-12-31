/* ========= UI, Cámaras, Validaciones, Estado ========= */
/* Helpers globales expuestos por app.utils.js:
   $, $$, throttle, DRAFT_KEY, msg, toDMS, bindNA
*/

(function () {
  /* Año en footer */
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* Fallback del logo */
  const logo = document.getElementById('logoImg');
  logo?.addEventListener('error', () => {
    const svg =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="70"><rect width="100%" height="100%" fill="#fff"/><text x="50%" y="54%" text-anchor="middle" font-family="Helvetica, Arial" font-size="18" fill="#111827">Agronomía Inteligente SRL</text></svg>`
      );
    logo.src = svg;
  });

  /* Fecha por defecto hoy */
  function setToday() {
    const i = document.getElementById('fechaInst');
    if (!i) return;
    const tz = new Date().getTimezoneOffset() * 60000;
    i.value = new Date(Date.now() - tz).toISOString().slice(0, 10);
  }
  setToday();

  /* Contador Observaciones */
  (() => {
    const ta = document.getElementById('obs');
    const out = document.getElementById('countObs');
    if (!ta || !out) return;
    const MAX = 800;
    const upd = () => {
      const n = Math.min(ta.value.length, MAX);
      out.textContent = `${n}/${MAX}`;
      if (ta.value.length > MAX) ta.value = ta.value.slice(0, MAX);
    };
    ta.addEventListener('input', upd);
    upd();
  })();

  const camList = document.getElementById('camList');

  const modelos = [
    '📷 HIKVISION DOMO PRO SOLAR',
    '📷 HIKVISION DOMO COLORVU SOLAR',
    '📷 HIKVISION FIJA SOLAR',
    '📷 HIKVISION FIJA HOGAREÑA',
  ];

  /* Imágenes de ejemplo (según tus archivos en la raíz) */
  const EXAMPLES = {
    Poste: './poste.jpg',
    Vivo: './vivo.jpg',
    Carga: './carga.jpg',
    Fij: './fij.jpg',
    Senal: './senal.jpg',
    CamPoste: './camposte.jpg',
  };

  /* Trozos UI */
  function planChunk(id) {
    return `
    <div class="block">
      <div class="subttl">A0) Parámetros técnicos</div>

      <div class="grid">
        <div class="field">
          <label for="${id}_tipo">Tipo de trabajo <span class="req">*</span></label>
          <select id="${id}_tipo" name="${id}_tipo" required class="ctl">
            <option value="">— Elegí —</option>
            <option value="A1">A1 — Instalación cámaras nuevas</option>
            <option value="A2">A2 — Instalación cámaras viejas</option>
            <option value="A3">A3 — Soporte cámaras nuevas</option>
            <option value="A4">A4 — Soporte cámaras viejas</option>
          </select>
        </div>
        <div class="field">
          <label for="${id}_estructura">Estructura</label>
          <select id="${id}_estructura" name="${id}_estructura" class="ctl">
            <option value="">— Elegí —</option>
            <option>Torre</option><option>Poste</option><option>Columna</option><option>Techo</option>
          </select>
        </div>
      </div>

      <div class="checks" style="grid-template-columns:repeat(3,1fr)">
        <label class="check"><input type="checkbox" id="${id}_chkUbic"/> <span>Ubicación confirmada</span></label>
        <label class="check"><input type="checkbox" id="${id}_chkSat"/> <span>Revisión satelital</span></label>
        <label class="check"><input type="checkbox" id="${id}_chkHerr"/> <span>Herramientas presentes</span></label>
      </div>
    </div>`;
  }

  function photoChunk(id) {
    const items = [
      ['Poste', 'Poste'],
      ['Vivo', 'Vista en vivo desde PC/celular'],
      ['Carga', 'Carga del panel solar'],
      ['Fij', 'Cámara instalada en poste — fijaciones (vista posterior)'],
      ['Senal', 'Nivel de señal'],
      ['CamPoste', 'Cámara y poste — vista completa'],
    ];
    return `
    <div class="photo-grid">
      ${items.map(([k, txt]) => `
        <div class="photo-cell">
          <div class="u">
            <input id="${id}_${k}" class="foto-labeled" type="file" accept="image/*" capture="environment" data-caption="${txt}"/>
            <label for="${id}_${k}">${txt}</label>
          </div>
          <div class="actions" style="justify-content:flex-start">
            <button type="button" class="btn ghost" data-ex="${k}">Ver ejemplo</button>
          </div>
          <small class="ph-caption">${txt}</small>
        </div>`).join('')}
    </div>`;
  }

  function testsChunk(id) {
    return `
    <div class="checks" style="grid-template-columns:repeat(3,1fr)">
      <label class="check"><input type="checkbox" id="${id}_t_vivo"/> <span>Vista en vivo</span></label>
      <label class="check"><input type="checkbox" id="${id}_t_noti"/> <span>Notificaciones app</span></label>
      <label class="check"><input type="checkbox" id="${id}_t_sd"/> <span>Micro SD grabando</span></label>
      <label class="check"><input type="checkbox" id="${id}_t_evt"/> <span>Eventos / movimientos</span></label>
      <label class="check"><input type="checkbox" id="${id}_t_panel"/> <span>Carga del panel</span></label>
    </div>`;
  }

  /* Modal ejemplo (imagen contenida/adaptable) */
  const ensureExampleModal = () => {
    if (document.getElementById('exModal')) return document.getElementById('exModal');
    const dlg = document.createElement('dialog');
    dlg.id = 'exModal';
    dlg.style.padding = '0';
    dlg.innerHTML = `
      <form method="dialog" style="margin:0;padding:0">
        <div style="max-width:min(96vw,920px);max-height:90vh;width:96vw;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.28);border:1px solid #e7ebf2;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid #eef2f8">
            <strong style="font:900 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto">Ejemplo de foto requerida</strong>
            <button class="btn ghost" value="close" style="margin:0">Cerrar</button>
          </div>
          <div style="padding:12px;overflow:auto;display:flex;flex-direction:column;align-items:center;">
            <img id="exImg" src="" alt="Ejemplo" style="display:block;width:100%;height:auto;max-height:70vh;object-fit:contain;border-radius:14px;border:1px solid #e7ebf2"/>
            <p id="exCap" style="margin:.7rem 0 0;color:#334155;font-size:.98rem;align-self:flex-start;"></p>
          </div>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    return dlg;
  };

  /* Tarjeta de cámara */
  function camCard() {
    const token = (crypto?.randomUUID?.() || 'id' + Date.now() + Math.random()).slice(0, 8);
    const id = `cam_${token}`;
    const el = document.createElement('div');
    el.className = 'cam-card';
    el.dataset.cam = id;

    el.innerHTML = `
      <div class="cam-head">
        <h3 class="cam-title">Cámara</h3>
        <button class="cam-remove btn ghost" type="button">Eliminar</button>
      </div>

      ${planChunk(id)}

      <div class="grid">
        <div class="field">
          <label>Modelo</label>
          <select name="${id}_modelo" class="ctl">
            ${modelos.map((m) => `<option>${m}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>N° de serie</label>
          <input type="text" name="${id}_serie" class="mono ctl"/>
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <label>Tipo de conexión</label>
          <select name="${id}_conexion" class="ctl">
            <option value="">— Elegí —</option>
            <option>Solar</option><option>220 V</option>
          </select>
        </div>
        <div class="field">
          <div class="label-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <label>Marca y modelo del módem</label>
            <label class="na muted"><input type="checkbox" id="${id}_modem_na"/> No aplica</label>
          </div>
          <input type="text" name="${id}_modem" placeholder="p.ej. Huawei B311…" class="ctl"/>
        </div>
      </div>

      <div class="block">
        <div class="subttl">Ubicación y conectividad</div>

        <div class="grid">
          <div class="field">
            <label>Operador SIM</label>
            <select name="${id}_operador" class="ctl">
              <option value="">— Elegí —</option>
              <option>Movistar</option><option>Claro</option><option>SIM MANAGER</option>
            </select>
          </div>

          <div class="field">
            <label>Señal (dBm)</label>
            <input type="text" name="${id}_rssi" placeholder="-75 / -100" class="ctl"/>
          </div>
        </div>

        <div class="grid">
          <div class="field">
            <div class="label-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <label>Velocidad (Mbps up/down)</label>
              <label class="na muted"><input type="checkbox" id="${id}_vel_na"/> No aplica</label>
            </div>
            <input type="text" name="${id}_vel" placeholder="ej: 8 / 3" class="ctl"/>
          </div>

          <div class="field">
            <div class="label-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <label>Potencia radioenlace (dBm)</label>
              <label class="na muted"><input type="checkbox" id="${id}_radio_na"/> No aplica</label>
            </div>
            <input type="text" name="${id}_radio" placeholder="ej: -60" class="ctl"/>
          </div>
        </div>

        <div class="grid">
          <div class="field">
            <div class="label-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <label>Tensión (V)</label>
              <label class="na muted"><input type="checkbox" id="${id}_volt_na"/> No aplica</label>
            </div>
            <input type="text" name="${id}_volt" placeholder="ej: 12.0" class="ctl"/>
          </div>
          <div class="field"></div>
        </div>

        <div class="grid">
          <div class="field">
            <label>Latitud (GMS)</label>
            <input type="text" name="${id}_latGms" placeholder='ej: 38°24′51.8″ S' class="ctl"/>
          </div>
          <div class="field">
            <label>Longitud (GMS)</label>
            <input type="text" name="${id}_lonGms" placeholder='ej: 61°06′30.2″ W' class="ctl"/>
          </div>
        </div>

        <div class="actions">
          <button class="btn ghost" type="button" data-act="geo">Usar mi ubicación</button>
        </div>
      </div>

      <div class="block">
        <div class="subttl">Pruebas y validaciones</div>
        ${testsChunk(id)}
      </div>

      <div class="block">
        <div class="subttl">Fotos</div>
        ${photoChunk(id)}
      </div>
    `;

    /* Eventos */
    el.querySelector('.cam-remove')?.addEventListener('click', () => {
      el.remove(); renumCams(); saveDraft();
    });

    bindNA(el.querySelector(`#${id}_modem_na`), el.querySelector(`[name="${id}_modem"]`));
    bindNA(el.querySelector(`#${id}_radio_na`), el.querySelector(`[name="${id}_radio"]`));
    bindNA(el.querySelector(`#${id}_vel_na`),   el.querySelector(`[name="${id}_vel"]`));
    bindNA(el.querySelector(`#${id}_volt_na`),  el.querySelector(`[name="${id}_volt"]`));

    el.querySelector('[data-act="geo"]')?.addEventListener('click', async () => {
      const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      const apply = ({ coords }) => {
        el.querySelector(`[name="${id}_latGms"]`).value = toDMS(coords.latitude, true);
        el.querySelector(`[name="${id}_lonGms"]`).value = toDMS(coords.longitude, false);
        msg('ok', 'Ubicación aplicada a la cámara.'); saveDraftThrottled();
      };
      try {
        if (navigator.permissions?.query) {
          try {
            const st = await navigator.permissions.query({ name: 'geolocation' });
            if (st.state === 'denied') { msg('err','Permiso de ubicación denegado.'); return; }
          } catch {}
        }
        if (!('geolocation' in navigator)) { msg('err','Geolocalización no disponible.'); return; }
        navigator.geolocation.getCurrentPosition(
          apply,
          (err)=>msg('err','No se pudo obtener ubicación ('+err.code+').'),
          opts
        );
      } catch {
        msg('err','No se pudo obtener la ubicación.');
      }
    });

    el.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-ex]');
      if (!btn) return;
      const key = btn.getAttribute('data-ex');
      const dlg = ensureExampleModal();
      dlg.querySelector('#exImg').src = EXAMPLES[key] || '';
      dlg.querySelector('#exCap').textContent =
        btn.closest('.photo-cell')?.querySelector('.ph-caption')?.textContent || key;
      dlg.showModal();
    });

    const num = $$('.cam-card', camList).length + 1;
    el.querySelector('.cam-title').textContent = `Cámara #${num}`;
    el.addEventListener('input', saveDraftThrottled);

    return el;
  }

  function renumCams(){ $$('.cam-card', camList).forEach((el,i)=> el.querySelector('.cam-title').textContent = `Cámara #${i+1}`); }
  function addCam(){ camList.appendChild(camCard()); saveDraft(); }
  document.getElementById('btnAddCam')?.addEventListener('click', addCam);

  /* ===== Estado (autosave / restore) ===== */
  function serialize(){
    const data = {
      A:{ cliNombre:$('#cliNombre')?.value, cliTel:$('#cliTel')?.value, cliDireccion:$('#cliDireccion')?.value, cliCiudad:$('#cliCiudad')?.value, tecNombre:$('#tecNombre')?.value, fechaInst:$('#fechaInst')?.value },
      C:{ obs:$('#obs')?.value, okCableado:!!$('#okCableado')?.checked, okMontura:!!$('#okMontura')?.checked, okCotorra:!!$('#okCotorra')?.checked },
      D:{
        conf:!!$('#confOficina')?.checked,
        horaConf: $('#horaConf')?.value,
        validador: $('#validador')?.value
      },
      cams: $$('.cam-card', camList).map(el=>{
        const id=el.dataset.cam, pick=n=>el.querySelector(`[name="${id}_${n}"]`), chk=s=>el.querySelector(`#${id}_${s}`)?.checked||false;
        return { id,
          tipo:el.querySelector(`#${id}_tipo`)?.value||'', estructura:el.querySelector(`#${id}_estructura`)?.value||'',
          chkUbic:chk('chkUbic'), chkSat:chk('chkSat'), chkHerr:chk('chkHerr'),
          modelo:pick('modelo')?.value||'', serie:pick('serie')?.value||'', conexion:pick('conexion')?.value||'',
          modem_na:chk('modem_na'), modem:pick('modem')?.value||'',
          operador:pick('operador')?.value||'',
          rssi:pick('rssi')?.value||'',
          vel_na:chk('vel_na'), vel:pick('vel')?.value||'',
          radio_na:chk('radio_na'), radio:pick('radio')?.value||'',
          volt_na:chk('volt_na'), volt:pick('volt')?.value||'',
          latGms:pick('latGms')?.value||'', lonGms:pick('lonGms')?.value||''
        };
      })
    };
    return data;
  }

  function deserialize(data){
    if(!data) return;
    $('#cliNombre') && ($('#cliNombre').value=data?.A?.cliNombre||'');
    $('#cliTel') && ($('#cliTel').value=data?.A?.cliTel||'');
    $('#cliDireccion') && ($('#cliDireccion').value=data?.A?.cliDireccion||'');
    $('#cliCiudad') && ($('#cliCiudad').value=data?.A?.cliCiudad||'');
    $('#tecNombre') && ($('#tecNombre').value=data?.A?.tecNombre||'');
    $('#fechaInst') && ($('#fechaInst').value=data?.A?.fechaInst||'');

    $('#obs') && ($('#obs').value=data?.C?.obs||'');
    $('#okCableado') && ($('#okCableado').checked=!!data?.C?.okCableado);
    $('#okMontura') && ($('#okMontura').checked=!!data?.C?.okMontura);
    $('#okCotorra') && ($('#okCotorra').checked=!!data?.C?.okCotorra);

    $('#confOficina') && ($('#confOficina').checked=!!data?.D?.conf);
    $('#horaConf') && ($('#horaConf').value=data?.D?.horaConf||'');
    $('#validador') && ($('#validador').value=data?.D?.validador||'');

    camList.innerHTML='';
    (data.cams||[]).forEach(c=>{
      const el=camCard(), id=el.dataset.cam;
      el.querySelector(`#${id}_tipo`).value=c.tipo;
      el.querySelector(`#${id}_estructura`).value=c.estructura;
      el.querySelector(`#${id}_chkUbic`).checked=!!c.chkUbic;
      el.querySelector(`#${id}_chkSat`).checked=!!c.chkSat;
      el.querySelector(`#${id}_chkHerr`).checked=!!c.chkHerr;

      el.querySelector(`[name="${id}_modelo"]`).value=c.modelo;
      el.querySelector(`[name="${id}_serie"]`).value=c.serie;
      el.querySelector(`[name="${id}_conexion"]`).value=c.conexion;

      el.querySelector(`#${id}_modem_na`).checked=!!c.modem_na;
      el.querySelector(`[name="${id}_modem"]`).value=c.modem;

      el.querySelector(`[name="${id}_operador"]`).value=c.operador;

      el.querySelector(`[name="${id}_rssi"]`).value=c.rssi;

      el.querySelector(`#${id}_vel_na`).checked=!!c.vel_na;
      el.querySelector(`[name="${id}_vel"]`).value=c.vel;

      el.querySelector(`#${id}_radio_na`).checked=!!c.radio_na;
      el.querySelector(`[name="${id}_radio"]`).value=c.radio;

      el.querySelector(`#${id}_volt_na`).checked=!!c.volt_na;
      el.querySelector(`[name="${id}_volt"]`).value=c.volt;

      el.querySelector(`[name="${id}_latGms"]`).value=c.latGms;
      el.querySelector(`[name="${id}_lonGms"]`).value=c.lonGms;

      camList.appendChild(el);
    });
    renumCams();
  }

  function saveDraft(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(serialize())); }
  const saveDraftThrottled = throttle(saveDraft, 800);

  function restoreDraft(){
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    try { deserialize(JSON.parse(raw)); } catch {}
  }

  /* Inicialización */
  restoreDraft();
  if (!$$('.cam-card').length) camList.appendChild(camCard());

  /* ===== Validaciones + envío ===== */
  function validarPrevios(){
    const cards = $$('.cam-card', camList);
    if(!cards.length){ msg('err','Agregá al menos una cámara.'); return false; }
    $$('.invalid').forEach(n=>n.classList.remove('invalid'));

    for (const el of cards){
      const id = el.dataset.cam;
      const tipo = el.querySelector(`#${id}_tipo`)?.value;
      const ub = el.querySelector(`#${id}_chkUbic`)?.checked;
      const sat = el.querySelector(`#${id}_chkSat`)?.checked;
      if(!tipo){ el.querySelector(`#${id}_tipo`).classList.add('invalid'); msg('err',`Seleccioná Tipo de trabajo en ${el.querySelector('.cam-title').textContent}.`); return false; }
      if(!ub || !sat){ msg('err',`Confirmá Ubicación e imagen satelital en ${el.querySelector('.cam-title').textContent}.`); return false; }

      const conexion = el.querySelector(`[name="${id}_conexion"]`)?.value || '';
      const voltNA = el.querySelector(`#${id}_volt_na`)?.checked;
      const voltVal = el.querySelector(`[name="${id}_volt"]`)?.value?.trim();
      const radioNA = el.querySelector(`#${id}_radio_na`)?.checked;
      const radioVal = el.querySelector(`[name="${id}_radio"]`)?.value?.trim();

      if(['A2','A4'].includes(tipo)){
        if(!voltNA && !voltVal){ el.querySelector(`[name="${id}_volt"]`).classList.add('invalid'); msg('err',`Para ${tipo}, completá Tensión (o NA) en ${el.querySelector('.cam-title').textContent}.`); return false; }
        if(!radioNA && !radioVal){ el.querySelector(`[name="${id}_radio"]`).classList.add('invalid'); msg('err',`Para ${tipo}, completá Potencia radioenlace (o NA) en ${el.querySelector('.cam-title').textContent}.`); return false; }
      }
      if(conexion==='220 V' && !voltNA && !voltVal){
        el.querySelector(`[name="${id}_volt"]`).classList.add('invalid');
        msg('err',`Con 220 V, Tensión es obligatoria (o NA) en ${el.querySelector('.cam-title').textContent}.`);
        return false;
      }
    }

    if(!document.getElementById('confOficina')?.checked){
      msg('err','No podés cerrar sin confirmación de Oficina (visibilidad remota).');
      return false;
    }
    return true;
  }

  document.getElementById('btnEnviar')?.addEventListener('click', async ()=>{
    const form = document.getElementById('formInstalacion');
    if (!form.checkValidity()){ form.reportValidity(); return msg('err','Completá los campos requeridos.'); }
    if (!validarPrevios()) return;

    try{
      await window.generarPDFyCompartir();
      msg('ok','PDF generado y descargado. Abrí WhatsApp para enviar (si no se abrió solo).');
    }catch(e){ console.error(e); msg('err','No se pudo generar/compartir el PDF.'); }
  });

  /* ===== Limpiar todo ===== */
  document.getElementById('btnReset')?.addEventListener('click', ()=>{
    const form = document.getElementById('formInstalacion');
    try { form.reset(); } catch {}
    localStorage.removeItem(DRAFT_KEY);

    camList.innerHTML='';
    camList.appendChild(camCard());

    const c = document.getElementById('canvasFirm');
    if (c?.getContext){
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,c.width,c.height);
    }

    setToday();
    msg('', '');
  });

  /* Limpiar firma solo */
  document.getElementById('btnClearFirm')?.addEventListener('click', ()=>{
    const c = document.getElementById('canvasFirm');
    if (c?.getContext){
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,c.width,c.height);
    }
  });

  /* ===== Firma (soporta mouse y táctil, responsive) ===== */
  (function initSignaturePad(){
    const canvas = document.getElementById('canvasFirm');
    if(!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    let drawing = false;

    function resize(){
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight || 180;
      canvas.width  = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.lineWidth = 2;
      ctx.lineCap   = 'round';
      ctx.strokeStyle = '#0b1220';
    }
    resize();
    window.addEventListener('resize', resize);

    canvas.style.touchAction = 'none';

    const pos = (e)=>{
      const r = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return {x,y};
    };

    const down = (e)=>{ drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
    const move = (e)=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); };
    const up   = ()=>{ drawing=false; };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  })();

})();
