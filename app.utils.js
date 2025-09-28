/* ========= Utils & Helpers ========= */
window.$  = (s, c=document)=>c.querySelector(s);
window.$$ = (s, c=document)=>[...c.querySelectorAll(s)];
window.DRAFT_KEY = 'ai_parte_instalacion_v1';

window.throttle = (fn, wait=500)=>{
  let t=0; return (...a)=>{ const n=Date.now(); if(n-t>wait){ t=n; fn(...a); } };
};

/* Mensajes UI */
window.msg = (kind, text)=>{
  const fm = $('#formMsg'); if(!fm) return;
  fm.classList.remove('ok','err');
  if(kind) fm.classList.add(kind);
  fm.textContent = text || '';
};

/* Grados decimales -> GMS */
window.toDMS = (dec, isLat=true)=>{
  if (dec === null || dec === undefined || isNaN(dec)) return '';
  const dir = dec>=0 ? (isLat?'N':'E') : (isLat?'S':'W');
  const abs = Math.abs(dec);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${d}°${m}′${s}″ ${dir}`;
};

/* Imagen -> dataURL redimensionada */
window.readImageAsDataURL = (file, maxW=720, quality=.82)=>{
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
};

/* ====== Sanitización para PDF ======
   - Remueve emojis y caracteres fuera de Latin-1
   - Normaliza comillas, guiones y espacios finos
*/
const RE_NON_LATIN1 = /[^\x09\x0A\x0D\x20-\xFF]/g; // fuera de Latin-1
const replacements = [
  [/[\u2018\u2019\u201A\u275B\u275C]/g, "'"],   // comillas simples curvas
  [/[\u201C\u201D\u201E\u275D\u275E]/g, '"'],   // comillas dobles curvas
  [/[\u2013\u2014\u2212]/g, "-"],               // guiones/emdash
  [/\u00A0/g, " "],                             // espacio no separable
  [/\u200B|\u200C|\u200D|\uFEFF/g, ""],         // zero-width
];

window.sanitizeForPDF = (str)=>{
  if (typeof str !== 'string') return str ?? '';
  let s = str;
  for (const [re, rep] of replacements) s = s.replace(re, rep);
  // quita emojis y otros fuera de Latin-1
  s = s.replace(RE_NON_LATIN1, "");
  return s;
};

/* Quitar emojis explícitamente (por si se quieren filtrar antes) */
window.stripEmojis = (str)=>{
  if (typeof str !== 'string') return str ?? '';
  // rango amplio de símbolos/emojis comunes
  return str.replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, "");
};

/* Binds "No aplica" */
window.bindNA = (chk, input)=>{
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
};
