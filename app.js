/* ===== Helpers ===== */
const $  = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>[...c.querySelectorAll(s)];
const DRAFT_KEY = 'ai_parte_instalacion_v1';
const throttle = (fn, wait=500)=>{ let t=0; return (...a)=>{ const n=Date.now(); if(n-t>wait){ t=n; fn(...a); } }; };

/* Año footer */
$('#year').textContent = new Date().getFullYear();

/* Fallback del logo */
$('#logoImg')?.addEventListener('error', ()=>{
  const svg = 'data:image/svg+xml;utf8,'+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="70">
      <rect width="100%" height="100%" fill="#fff"/>
      <text x="50%" y="54%" text-anchor="middle" font-family="Helvetica, Arial" font-size="18" fill="#111827">
        Agronomía Inteligente SRL
      </text>
    </svg>`
  );
  $('#logoImg').src = svg;
});

/* Fecha por defecto hoy (YYYY-MM-DD local) */
(()=>{ const i=$('#fechaInst'); if(!i) return;
  const tz=(new Date()).getTimezoneOffset()*60000;
  i.value=new Date(Date.now()-tz).toISOString().slice(0,10);
})();

/* Contador Observaciones */
(()=>{ const ta=$('#obs'), out=$('#countObs'); if(!ta||!out) return; const MAX=800;
  const upd=()=>{ const n=Math.min(ta.value.length,MAX); out.textContent=`${n}/${MAX}`; if(ta.value.length>MAX) ta.value=ta.value.slice(0,MAX); };
  ta.addEventListener('input',upd); upd();
})();

/* ===== Firma (Pointer Events) ===== */
(() => {
  const canvas=$('#canvasFirm'); if(!canvas) return;
  const ctx=canvas.getContext('2d', { willReadFrequently:true });
  let drawing=false;

  function resize(){
    const dpr=window.devicePixelRatio||1;
    const w=canvas.clientWidth, h=canvas.clientHeight;
    canvas.width=Math.floor(w*dpr);
    canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#111827';
  }
  resize(); addEventListener('resize', resize);
  const pos=e=>{ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
  const down=e=>{ drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
  const move=e=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); };
  const up=()=>{ drawing=false; };

  canvas.addEventListener('pointerdown',down);
  canvas.addEventListener('pointermove',move);
  addEventListener('pointerup',up);
  addEventListener('pointercancel',up);

  $('#btnClearFirm')?.addEventListener('click', ()=> ctx.clearRect(0,0,canvas.width,canvas.height));
})();

/* ===== Utiles ===== */
function toDMS(dec, isLat=true){
  const dir = dec>=0 ? (isLat?'N':'E') : (isLat?'S':'W');
  const abs = Math.abs(dec);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${d}°${m}′${s}″ ${dir}`;
}
function msg(kind, text){
  const fm=$('#formMsg'); fm.classList.remove('ok','err');
  if(kind) fm.classList.add(kind);
  fm.textContent = text || '';
}

/* ===== Constantes / data ===== */
const camList = $('#camList');
const modelos = [
  '📷 HIKVISION DOMO PRO SOLAR',
  '📷 HIKVISION DOMO COLORVU SOLAR',
  '📷 HIKVISION FIJA SOLAR',
  '📷 HIKVISION FIJA HOGAREÑA'
];

/* Imágenes de ejemplo (en la raíz del proyecto, según tu carpeta) */
const EXAMPLES = {
  Poste:    './poste.jpg',
  Vivo:     './vivo.jpg',
  Carga:    './carga.jpg',
  Fij:      './fij.jpg',
  Senal:    './senal.jpg',
  CamPoste: './camposte.jpg',
};

/* ===== Binds NA ===== */
function bindNA(chk, input){
  if(!chk || !input) return;
  const apply=()=>{
    if(chk.checked){
      input.disabled=true; input.classList.add('na-disabled');
      if(!input.dataset.prevPlaceholder) input.dataset.prevPlaceholder=input.placeholder||'';
      input.placeholder='No aplica'; input.value='';
    }else{
      input.disabled=false; input.classList.remove('na-disabled');
      input.placeholder=input.dataset.prevPlaceholder||'';
    }
  };
  chk.addEventListener('change', apply); apply();
}

/* APNs por operador */
function opDefaults(op){
  switch(op){
    case 'Movistar':    return { apn: 'internet.gprs.unifon.com.ar', user: '',         pass: ''         };
    case 'Claro':       return { apn: 'igprs.claro.com.ar',          user: 'INTERNET', pass: 'INTERNET' };
    case 'SIM MANAGER': return { apn: 'wingtp.personal.com',         user: '',         pass: ''         };
    default:            return { apn: '',                            user: '',         pass: ''         };
  }
}

/* ===== Trozos UI por cámara ===== */
function planChunk(id){
  return `
  <div class="block">
    <div class="subttl">A0) Parámetros técnicos</div>
    <div class="grid">
      <div class="field">
        <label for="${id}_tipo">🧩 Tipo de trabajo <span class="req">*</span></label>
        <select id="${id}_tipo" name="${id}_tipo" required>
          <option value="">— Elegí —</option>
          <option value="A1">A1 — Instalación cámaras nuevas</option>
          <option value="A2">A2 — Instalación cámaras viejas</option>
          <option value="A3">A3 — Soporte cámaras nuevas</option>
          <option value="A4">A4 — Soporte cámaras viejas</option>
        </select>
      </div>
      <div class="field">
        <label for="${id}_estructura">🏗️ Estructura</label>
        <select id="${id}_estructura" name="${id}_estructura">
          <option value="">— Elegí —</option>
          <option>Torre</option><option>Poste</option><option>Columna</option><option>Techo</option>
        </select>
      </div>
    </div>
    <div class="grid-3 checkgrid">
      <label class="check"><input type="checkbox" id="${id}_chkUbic"/> <span>📍 Ubicación confirmada</span></label>
      <label class="check"><input type="checkbox" id="${id}_chkSat"/> <span>🛰️ Revisión satelital</span></label>
      <label class="check"><input type="checkbox" id="${id}_chkHerr"/> <span>🧰 Herramientas presentes</span></label>
    </div>
  </div>`;
}

function photoChunk(id){
  const items = [
    ['Poste','Poste'],
    ['Vivo','Vista en vivo desde PC/celular'],
    ['Carga','Carga del panel solar'],
    ['Fij','Cámara instalada en poste — fijaciones (vista posterior)'],
    ['Senal','Nivel de señal'],
    ['CamPoste','Cámara y poste — vista completa']
  ];
  return `
  <div class="photo-grid">
    ${items.map(([k,txt])=>`
      <div class="photo-cell">
        <div class="u">
          <input id="${id}_${k}" class="foto-labeled" type="file" accept="image/*" capture="environment" data-caption="${txt}"/>
          <label for="${id}_${k}">📸 ${txt}</label>
        </div>
        <div class="actions" style="justify-content:flex-start">
          <button type="button" class="btn ghost small" data-ex="${k}">🔍 Ver ejemplo</button>
        </div>
        <small class="ph-caption">${txt}</small>
      </div>
    `).join('')}
  </div>`;
}

function testsChunk(id){
  return `
  <div class="grid-3">
    <label class="check"><input type="checkbox" id="${id}_t_vivo"/> <span>👁️ Vista en vivo</span></label>
    <label class="check"><input type="checkbox" id="${id}_t_noti"/> <span>🔔 Notificaciones app</span></label>
    <label class="check"><input type="checkbox" id="${id}_t_sd"/> <span>💾 Micro SD grabando</span></label>
    <label class="check"><input type="checkbox" id="${id}_t_evt"/> <span>🎯 Eventos / movimientos</span></label>
    <label class="check"><input type="checkbox" id="${id}_t_panel"/> <span>🔌 Carga del panel</span></label>
  </div>`;
}

/* ===== Modal de ejemplo (ajustado para no cortar imágenes) ===== */
const ensureExampleModal = ()=>{
  if ($('#exModal')) return $('#exModal');
  const dlg = document.createElement('dialog');
  dlg.id = 'exModal';
  dlg.style.padding = '0'; // para móviles
  dlg.innerHTML = `
    <form method="dialog" style="margin:0;padding:0">
      <div style="
        max-width:min(96vw,900px);
        max-height:90vh;
        width:96vw;
        background:#fff; border-radius:14px; overflow:hidden;
        box-shadow:0 20px 50px rgba(0,0,0,.25); border:1px solid #e5e7eb;
        display:flex; flex-direction:column;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 12px; border-bottom:1px solid #eee">
          <strong style="font:600 16px/1.2 system-ui, -apple-system, Segoe UI, Roboto">Ejemplo de foto requerida</strong>
          <button class="btn" value="close" style="margin:0">✖️ Cerrar</button>
        </div>
        <div style="padding:10px; overflow:auto; display:flex; flex-direction:column; align-items:center;">
          <img id="exImg" src="" alt="Ejemplo" style="
            display:block;
            width:100%;
            height:auto;
            max-height:70vh;
            object-fit:contain;
            border-radius:10px;
          "/>
          <p id="exCap" style="margin:.6rem 0 0; color:#374151; font-size:.95rem; align-self:flex-start;"></p>
        </div>
      </div>
    </form>`;
  document.body.appendChild(dlg);
  return dlg;
};

/* ===== Tarjeta de cámara ===== */
function camCard(){
  const token = (crypto?.randomUUID?.() || ('id'+Date.now()+Math.random())).slice(0,8);
  const id = `cam_${token}`;
  const el = document.createElement('div');
  el.className = 'cam-card';
  el.dataset.cam = id;
  el.innerHTML = `
    <div class="cam-head">
      <h3 class="cam-title">Cámara</h3>
      <button class="cam-remove" type="button">🗑️ Eliminar</button>
    </div>

    ${planChunk(id)}

    <!-- Datos básicos -->
    <div class="grid">
      <div class="field">
        <label>📦 Modelo</label>
        <select name="${id}_modelo">
          ${modelos.map(m=>`<option>${m}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>🔖 N° de serie</label>
        <input type="text" name="${id}_serie" class="mono"/>
      </div>
    </div>

    <div class="grid">
      <div class="field">
        <label>🔌 Tipo de conexión</label>
        <select name="${id}_conexion">
          <option value="">— Elegí —</option>
          <option>Solar</option><option>220 V</option>
        </select>
      </div>
      <div class="field">
        <div class="label-row">
          <label>📶 Marca y modelo del módem</label>
          <label class="na"><input type="checkbox" id="${id}_modem_na"/> No aplica</label>
        </div>
        <input type="text" name="${id}_modem" placeholder="p.ej. Huawei B311…"/>
      </div>
    </div>

    <!-- Ubicación y conectividad -->
    <div class="block">
      <div class="subttl">🌐 Ubicación y conectividad</div>
      <div class="grid-3">
        <div class="field">
          <label>📡 Operador SIM</label>
          <select name="${id}_operador">
            <option value="">— Elegí —</option>
            <option>Movistar</option>
            <option>Claro</option>
            <option>SIM MANAGER</option>
          </select>
        </div>
        <div class="field">
          <label>🛠️ APN</label>
          <input type="text" name="${id}_apn" placeholder="APN"/>
        </div>
        <div class="field">
          <label>👤 Usuario APN</label>
          <input type="text" name="${id}_apn_user" placeholder="Usuario (si aplica)"/>
        </div>
        <div class="field">
          <label>🔒 Password APN</label>
          <input type="text" name="${id}_apn_pass" placeholder="Password (si aplica)"/>
        </div>
        <div class="field">
          <label>📶 Señal (dBm)</label>
          <input type="text" name="${id}_rssi" placeholder="-75 / -100"/>
        </div>
        <div class="field">
          <div class="label-row">
            <label>⏱️ Velocidad (Mbps up/down)</label>
            <label class="na"><input type="checkbox" id="${id}_vel_na"/> No aplica</label>
          </div>
          <input type="text" name="${id}_vel" placeholder="ej: 8 / 3"/>
        </div>
        <div class="field">
          <div class="label-row">
            <label>📡 Potencia radioenlace (dBm)</label>
            <label class="na"><input type="checkbox" id="${id}_radio_na"/> No aplica</label>
          </div>
          <input type="text" name="${id}_radio" placeholder="ej: -60"/>
        </div>
        <div class="field">
          <div class="label-row">
            <label>🔋 Tensión (V)</label>
            <label class="na"><input type="checkbox" id="${id}_volt_na"/> No aplica</label>
          </div>
          <input type="text" name="${id}_volt" placeholder="ej: 12.0"/>
        </div>
      </div>

      <div class="grid">
        <div class="field">
          <label>🧭 Latitud (GMS)</label>
          <input type="text" name="${id}_latGms" placeholder='ej: 38°24′51.8″ S'/>
        </div>
        <div class="field">
          <label>🧭 Longitud (GMS)</label>
          <input type="text" name="${id}_lonGms" placeholder='ej: 61°06′30.2″ W'/>
        </div>
      </div>

      <div class="actions">
        <button class="btn" type="button" data-act="geo">📍 Usar mi ubicación</button>
      </div>
    </div>

    <!-- Pruebas por cámara -->
    <div class="block">
      <div class="subttl">✅ Pruebas y validaciones</div>
      ${testsChunk(id)}
    </div>

    <!-- Fotos por cámara (con “Ver ejemplo”) -->
    <div class="block">
      <div class="subttl">🖼️ Fotos</div>
      ${photoChunk(id)}
    </div>
  `;

  /* Eventos internos */
  el.querySelector('.cam-remove').addEventListener('click', ()=>{ el.remove(); renumCams(); saveDraft(); });

  /* Binds de NA */
  bindNA(el.querySelector(`#${id}_modem_na`), el.querySelector(`[name="${id}_modem"]`));
  bindNA(el.querySelector(`#${id}_radio_na`), el.querySelector(`[name="${id}_radio"]`));
  bindNA(el.querySelector(`#${id}_vel_na`),   el.querySelector(`[name="${id}_vel"]`));
  bindNA(el.querySelector(`#${id}_volt_na`),  el.querySelector(`[name="${id}_volt"]`));

  /* Defaults por operador */
  const selOp = el.querySelector(`[name="${id}_operador"]`);
  const apn   = el.querySelector(`[name="${id}_apn"]`);
  const apnU  = el.querySelector(`[name="${id}_apn_user"]`);
  const apnP  = el.querySelector(`[name="${id}_apn_pass"]`);
  selOp.addEventListener('change', ()=>{
    const d = opDefaults(selOp.value);
    apn.value = d.apn; apnU.value = d.user; apnP.value = d.pass; saveDraftThrottled();
  });

  /* Geolocalización */
  el.querySelector('[data-act="geo"]').addEventListener('click', async ()=>{
    const opts = { enableHighAccuracy:true, timeout:15000, maximumAge:0 };
    const apply = ({coords})=>{
      el.querySelector(`[name="${id}_latGms"]`).value = toDMS(coords.latitude,true);
      el.querySelector(`[name="${id}_lonGms"]`).value = toDMS(coords.longitude,false);
      msg('ok','Ubicación aplicada a la cámara.'); saveDraftThrottled();
    };
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try { const st = await navigator.permissions.query({name:'geolocation'}); if (st.state === 'denied') { msg('err','Permiso de ubicación denegado.'); return; } } catch {}
      }
      if (!('geolocation' in navigator)) { msg('err','Geolocalización no disponible.'); return; }
      navigator.geolocation.getCurrentPosition(apply, (err)=>{ msg('err','No se pudo obtener la ubicación ('+err.code+').'); }, opts);
    } catch { msg('err','No se pudo obtener la ubicación.'); }
  });

  /* Delegación: Ver ejemplo */
  el.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('[data-ex]'); if(!btn) return;
    const key = btn.getAttribute('data-ex');
    const img = EXAMPLES[key]; const cap = btn.closest('.photo-cell')?.querySelector('.ph-caption')?.textContent || key;
    const dlg = ensureExampleModal();
    dlg.querySelector('#exImg').src = img || '';
    dlg.querySelector('#exCap').textContent = cap || '';
    dlg.showModal();
  });

  /* Título incremental y autosave */
  const num = $$('.cam-card', camList).length + 1;
  el.querySelector('.cam-title').textContent = `Cámara #${num}`;
  el.addEventListener('input', saveDraftThrottled);

  return el;
}

function renumCams(){ $$('.cam-card', camList).forEach((el,i)=> el.querySelector('.cam-title').textContent = `Cámara #${i+1}`); }
function addCam(){ camList.appendChild(camCard()); saveDraft(); }
$('#btnAddCam')?.addEventListener('click', addCam);

/* ===== Imagen helper ===== */
function readImageAsDataURL(file, maxW=720, quality=.82){
  return new Promise(resolve=>{
    if(!file) return resolve(null);
    const img=new Image(), fr=new FileReader();
    fr.onload=()=> img.src=fr.result;
    img.onload=()=>{
      const scale=Math.min(1,maxW/img.width);
      const c=document.createElement('canvas'); c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      resolve(c.toDataURL('image/jpeg',quality));
    };
    fr.readAsDataURL(file);
  });
}

/* ===== Validaciones ===== */
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
    const voltVal = el.querySelector(`[name="${id}_volt"]`)?.value.trim();
    const radioNA = el.querySelector(`#${id}_radio_na`)?.checked;
    const radioVal = el.querySelector(`[name="${id}_radio"]`)?.value.trim();

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

  if(!$('#confOficina').checked){ msg('err','No podés cerrar sin confirmación de Oficina (visibilidad remota).'); return false; }
  return true;
}

/* ===== PDF (genera Blob, descarga y comparte) ===== */
async function generarPDFyCompartir(){
  const { jsPDF } = window.jspdf || {}; if(!jsPDF) throw new Error('jsPDF no cargado');
  const doc = new jsPDF({ unit:'pt', format:'a4' });
  const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
  const M=56; let y=M;

  /* Encabezado */
  doc.setFont('helvetica','bold'); doc.setFontSize(15);
  doc.text('Agronomía Inteligente SRL — Parte de instalación', M, y); y+=22;
  doc.setDrawColor(245,158,11); doc.setLineWidth(2); doc.line(M,y,pageW-M,y); y+=16;

  /* A) Datos del servicio */
  const A = [
    ['Cliente', $('#cliNombre').value||''], ['Teléfono', $('#cliTel').value||''],
    ['Dirección', $('#cliDireccion').value||''], ['Ciudad/Prov.', $('#cliCiudad').value||''],
    ['Técnico', $('#tecNombre').value||''], ['Fecha', $('#fechaInst').value||'']
  ];
  doc.autoTable({ startY:y, head:[['A) Datos del servicio','Valor']], body:A, theme:'grid',
    styles:{ fontSize:9.5, cellPadding:5 }, headStyles:{ fillColor:[245,158,11] }, margin:{ left:M, right:M } });
  y = doc.lastAutoTable.finalY + 12;

  /* Cámaras */
  for (const [i,el] of $$('.cam-card', camList).entries()) {
    if(y>pageH-280){ doc.addPage(); y=M; }
    const blockX = M-6, blockW = pageW - 2*M + 12;
    const blockTopPadding = 18;
    let y0 = y + blockTopPadding;

    doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(`${el.querySelector('.cam-title').textContent}`, M, y0); y0 += 12;

    const id = el.dataset.cam;
    const A0 = [
      ['Tipo de trabajo', el.querySelector(`#${id}_tipo`)?.value || '—'],
      ['Estructura', el.querySelector(`#${id}_estructura`)?.value || '—'],
      ['Ubicación confirmada', el.querySelector(`#${id}_chkUbic`)?.checked ? 'Sí':'No'],
      ['Revisión con imagen satelital', el.querySelector(`#${id}_chkSat`)?.checked ? 'Sí':'No'],
      ['Herramientas básicas presentes', el.querySelector(`#${id}_chkHerr`)?.checked ? 'Sí':'No'],
    ];
    doc.autoTable({ startY:y0, head:[['A0) Parámetros técnicos','Valor']], body:A0, theme:'grid',
      styles:{ fontSize:9.5, cellPadding:4 }, headStyles:{ fillColor:[245,158,11] }, margin:{ left:M, right:M } });
    y0 = doc.lastAutoTable.finalY + 8;

    const modemNA = el.querySelector(`#${id}_modem_na`)?.checked;
    const modemVal = el.querySelector(`[name="${id}_modem"]`)?.value || '';
    const radioNA = el.querySelector(`#${id}_radio_na`)?.checked;
    const radioVal = el.querySelector(`[name="${id}_radio"]`)?.value || '';
    const voltNA  = el.querySelector(`#${id}_volt_na`)?.checked;
    const voltVal = el.querySelector(`[name="${id}_volt"]`)?.value || '';
    const velNA   = el.querySelector(`#${id}_vel_na`)?.checked;
    const velVal  = el.querySelector(`[name="${id}_vel"]`)?.value || '';

    const op   = el.querySelector(`[name="${id}_operador"]`)?.value || '';
    const apn  = el.querySelector(`[name="${id}_apn"]`)?.value || '';
    const apnU = el.querySelector(`[name="${id}_apn_user"]`)?.value || '';
    const apnP = el.querySelector(`[name="${id}_apn_pass"]`)?.value || '';

    const body = [
      ['Modelo', el.querySelector(`[name="${id}_modelo"]`)?.value || ''],
      ['Serie', el.querySelector(`[name="${id}_serie"]`)?.value || ''],
      ['Tipo de conexión', el.querySelector(`[name="${id}_conexion"]`)?.value || ''],
      ['Módem (marca/modelo)', modemNA ? 'No aplica' : modemVal],
      ['Operador', op || ''],
      ['APN', apn || ''],
      ['APN usuario/password', (apnU||apnP) ? `${apnU} / ${apnP}` : '—'],
      ['Señal (dBm)', el.querySelector(`[name="${id}_rssi"]`)?.value || ''],
      ['Velocidad', velNA ? 'No aplica' : (velVal || '')],
      ['Potencia radioenlace (dBm)', radioNA ? 'No aplica' : (radioVal || '')],
      ['Tensión (V)', voltNA ? 'No aplica' : (voltVal || '')],
      ['Lat/Lon (GMS)', `${el.querySelector(`[name="${id}_latGms"]`)?.value || ''} , ${el.querySelector(`[name="${id}_lonGms"]`)?.value || ''}`]
    ];
    doc.autoTable({ startY: y0, body, theme:'plain', styles:{ fontSize:10, cellPadding:3 }, margin:{ left:M, right:M } });
    y0 = doc.lastAutoTable.finalY + 8;

    /* Fotos (miniaturas) */
    const keys = ['Poste','Vivo','Carga','Fij','Senal','CamPoste'];
    const items=[];
    for(const k of keys){
      const inp = el.querySelector(`#${id}_${k}`);
      const f = inp?.files?.[0];
      if(!f) continue;
      const data = await readImageAsDataURL(f, 420, .82);
      items.push({data, caption: inp.dataset.caption});
    }
    if(items.length){
      doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.text('Fotos', M, y0); y0 += 6;
      const size=110, gap=10; let x=M, rowH=size+22;
      for(const it of items){
        if(x+size>pageW-M){ x=M; y0+=rowH; }
        if(y0+size+18>pageH-M){
          const blockY = y + 2;
          const blockH = (y0 - y) + 10;
          doc.setLineWidth(0.8); doc.setDrawColor(0,0,0);
          doc.roundedRect(M-6, blockY, pageW-2*M+12, blockH, 4, 4, 'S');
          doc.setLineWidth(0.6); doc.setDrawColor(245,158,11);
          doc.roundedRect(M-4, blockY+2, pageW-2*M+8, blockH-4, 3, 3, 'S');

          doc.addPage(); y = M; y0 = y + blockTopPadding;
          doc.setFont('helvetica','bold'); doc.setFontSize(12);
          doc.text(`${el.querySelector('.cam-title').textContent} (cont.)`, M, y0); y0 += 12;
          doc.setFont('helvetica','bold'); doc.setFontSize(11);
          doc.text('Fotos (cont.)', M, y0); y0 += 6; x = M;
        }
        doc.addImage(it.data, 'JPEG', x, y0, size, size);
        doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
        doc.text(doc.splitTextToSize(it.caption, size), x, y0+size+12);
        x+=size+gap;
      }
      y0 += rowH;
    }

    /* Marco del bloque */
    const blockY = y + 2;
    const blockH = (y0 - y) + 8;
    doc.setLineWidth(0.8); doc.setDrawColor(0,0,0);
    doc.roundedRect(M-6, blockY, pageW-2*M+12, blockH, 4, 4, 'S');
    doc.setLineWidth(0.6); doc.setDrawColor(245,158,11);
    doc.roundedRect(M-4, blockY+2, pageW-2*M+8, blockH-4, 3, 3, 'S');

    y = blockY + blockH + 12;
  }

  /* Observaciones */
  if (y>pageH-200){ doc.addPage(); y=M; }
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  doc.text('Observaciones generales', M, y); y+=12;
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(doc.splitTextToSize($('#obs').value||'—', pageW-2*M), M, y);
  y += 36;

  /* Calidad */
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  doc.text('Calidad y seguridad', M, y); y+=10;
  const qual = [
    ['Conexiones y cableado OK', $('#okCableado').checked?'Sí':'No'],
    ['Montura verificada', $('#okMontura').checked?'Sí':'No'],
    ['Protección contra cotorras', $('#okCotorra').checked?'Sí':'No'],
  ];
  doc.autoTable({ startY:y, body:qual, theme:'plain', styles:{ fontSize:10, cellPadding:3 }, margin:{ left:M, right:M } });
  y = doc.lastAutoTable.finalY + 18;

  /* Cierre técnico */
  if (y>pageH-180){ doc.addPage(); y=M; }
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  doc.text('Cierre del técnico', M, y); y+=10;

  const sig = $('#canvasFirm'); const dni = $('#dniTec').value||'';
  const hIni = $('#horaIni').value||''; const hFin = $('#horaFin').value||'';
  const horaConf = $('#horaConf').value||''; const validador = $('#validador').value||'';
  if(sig){
    const data = sig.toDataURL('image/png');
    doc.addImage(data,'PNG',M,y,220,110);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`DNI: ${dni}`, M+240, y+24);
    doc.text(`Hora inicio: ${hIni}`, M+240, y+44);
    doc.text(`Hora fin: ${hFin}`, M+240, y+64);
    doc.text(`Confirmación oficina: ${$('#confOficina').checked?'Sí':'No'}`, M+240, y+84);
    if(horaConf) doc.text(`Hora confirmación: ${horaConf}`, M+240, y+104);
    if(validador) doc.text(`Validador: ${validador}`, M+240, y+124);
  }

  /* Footer */
  doc.setDrawColor(229,231,235); doc.line(M, pageH-48, pageW-M, pageH-48);
  doc.setFontSize(9.5); doc.text(`Generado — ${new Date().toLocaleString()}`, M, pageH - 34);

  /* Blob + descarga */
  const blob = doc.output('blob');
  const fname = `parte-instalacion-${$('#fechaInst').value || new Date().toISOString().slice(0,10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fname; a.style.display='none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);

  /* Compartir por WhatsApp */
  await compartirPorWhatsApp(blob, fname);
}

/* ===== Compartir por WhatsApp ===== */
async function compartirPorWhatsApp(blob, filename){
  const numeroWhatsApp = '5491160301418'; // +54 9 11 6030-1418
  const texto = `👋 Envío el Parte de Instalación en PDF.\nArchivo: ${filename}\n(Adjunto el PDF descargado)`;
  try{
    const file = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() });
    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      await navigator.share({ files:[file], title:'Parte de instalación', text: 'Parte de instalación generado desde el formulario.' });
      msg('ok','PDF compartido desde la hoja de compartir.');
      return;
    }
  }catch(e){ /* Ignorar y hacer fallback */ }

  const wa = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
  window.open(wa, '_blank', 'noopener,noreferrer');
  msg('ok','PDF descargado. Se abrió WhatsApp con el mensaje. Adjuntá el PDF al chat.');
}

/* ===== Autosave / Restore ===== */
function serialize(){
  const data = {
    A: {
      cliNombre: $('#cliNombre').value,
      cliTel: $('#cliTel').value,
      cliDireccion: $('#cliDireccion').value,
      cliCiudad: $('#cliCiudad').value,
      tecNombre: $('#tecNombre').value,
      fechaInst: $('#fechaInst').value
    },
    C: {
      obs: $('#obs').value,
      okCableado: $('#okCableado').checked,
      okMontura: $('#okMontura').checked,
      okCotorra: $('#okCotorra').checked
    },
    D: {
      dni: $('#dniTec').value,
      horaIni: $('#horaIni').value,
      horaFin: $('#horaFin').value,
      conf: $('#confOficina').checked,
      horaConf: $('#horaConf').value,
      validador: $('#validador').value
    },
    cams: $$('.cam-card', camList).map(el=>{
      const id = el.dataset.cam;
      const pick = n=> el.querySelector(`[name="${id}_${n}"]`);
      const chk  = s=> el.querySelector(`#${id}_${s}`)?.checked || false;
      return {
        id,
        tipo:      el.querySelector(`#${id}_tipo`)?.value || '',
        estructura:el.querySelector(`#${id}_estructura`)?.value || '',
        chkUbic:   chk('chkUbic'),
        chkSat:    chk('chkSat'),
        chkHerr:   chk('chkHerr'),
        modelo:    pick('modelo')?.value || '',
        serie:     pick('serie')?.value || '',
        conexion:  pick('conexion')?.value || '',
        modem_na:  chk('modem_na'),
        modem:     pick('modem')?.value || '',
        operador:  pick('operador')?.value || '',
        apn:       pick('apn')?.value || '',
        apn_user:  pick('apn_user')?.value || '',
        apn_pass:  pick('apn_pass')?.value || '',
        rssi:      pick('rssi')?.value || '',
        vel_na:    chk('vel_na'),
        vel:       pick('vel')?.value || '',
        radio_na:  chk('radio_na'),
        radio:     pick('radio')?.value || '',
        volt_na:   chk('volt_na'),
        volt:      pick('volt')?.value || '',
        latGms:    pick('latGms')?.value || '',
        lonGms:    pick('lonGms')?.value || ''
      };
    })
  };
  return data;
}

function deserialize(data){
  if(!data) return;
  $('#cliNombre').value = data?.A?.cliNombre || '';
  $('#cliTel').value = data?.A?.cliTel || '';
  $('#cliDireccion').value = data?.A?.cliDireccion || '';
  $('#cliCiudad').value = data?.A?.cliCiudad || '';
  $('#tecNombre').value = data?.A?.tecNombre || '';
  $('#fechaInst').value = data?.A?.fechaInst || '';

  $('#obs').value = data?.C?.obs || '';
  $('#okCableado').checked = !!data?.C?.okCableado;
  $('#okMontura').checked  = !!data?.C?.okMontura;
  $('#okCotorra').checked  = !!data?.C?.okCotorra;

  $('#dniTec').value = data?.D?.dni || '';
  $('#horaIni').value = data?.D?.horaIni || '';
  $('#horaFin').value = data?.D?.horaFin || '';
  $('#confOficina').checked = !!data?.D?.conf;
  $('#horaConf').value = data?.D?.horaConf || '';
  $('#validador').value = data?.D?.validador || '';

  camList.innerHTML = '';
  (data.cams || []).forEach(c=>{
    const el = camCard();
    const id = el.dataset.cam;

    el.querySelector(`#${id}_tipo`).value = c.tipo;
    el.querySelector(`#${id}_estructura`).value = c.estructura;
    el.querySelector(`#${id}_chkUbic`).checked = !!c.chkUbic;
    el.querySelector(`#${id}_chkSat`).checked  = !!c.chkSat;
    el.querySelector(`#${id}_chkHerr`).checked = !!c.chkHerr;

    el.querySelector(`[name="${id}_modelo"]`).value = c.modelo;
    el.querySelector(`[name="${id}_serie"]`).value  = c.serie;
    el.querySelector(`[name="${id}_conexion"]`).value = c.conexion;

    el.querySelector(`#${id}_modem_na`).checked = !!c.modem_na;
    el.querySelector(`[name="${id}_modem"]`).value = c.modem;

    el.querySelector(`[name="${id}_operador"]`).value = c.operador;
    el.querySelector(`[name="${id}_apn"]`).value      = c.apn;
    el.querySelector(`[name="${id}_apn_user"]`).value = c.apn_user;
    el.querySelector(`[name="${id}_apn_pass"]`).value = c.apn_pass;

    el.querySelector(`[name="${id}_rssi"]`).value = c.rssi;

    el.querySelector(`#${id}_vel_na`).checked = !!c.vel_na;
    el.querySelector(`[name="${id}_vel"]`).value = c.vel;

    el.querySelector(`#${id}_radio_na`).checked = !!c.radio_na;
    el.querySelector(`[name="${id}_radio"]`).value = c.radio;

    el.querySelector(`#${id}_volt_na`).checked = !!c.volt_na;
    el.querySelector(`[name="${id}_volt"]`).value = c.volt;

    el.querySelector(`[name="${id}_latGms"]`).value = c.latGms;
    el.querySelector(`[name="${id}_lonGms"]`).value = c.lonGms;

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

/* Restaurar o crear una cámara */
restoreDraft();
if(!$$('.cam-card').length) addCam();

/* ===== Acciones ===== */
$('#btnEnviar')?.addEventListener('click', async ()=>{
  const form = $('#formInstalacion');
  if (!form.checkValidity()){
    form.reportValidity();
    return msg('err','Completá los campos requeridos.');
  }
  if (!validarPrevios()) return;

  try{
    await generarPDFyCompartir();
    msg('ok','PDF generado y descargado. Abrí WhatsApp para enviar (si no se abrió solo).');
  }catch(e){
    console.error(e);
    msg('err','No se pudo generar/compartir el PDF.');
  }
});

$('#btnReset')?.addEventListener('click', ()=>{
  localStorage.removeItem(DRAFT_KEY);
  msg('', '');
});
