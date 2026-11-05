/* Parte técnico: composición editorial en escala de grises y fotos grandes y paginación continua. */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clean = value => window.sanitizeForPDF(String(value ?? ''));
  const value = id => document.getElementById(id)?.value?.trim() || 'Sin registrar';
  const yes = element => element?.checked ? 'Sí' : 'No';

  async function photoData(file) {
    const url = await window.readImageAsDataURL(file, 1800, .9);
    return url;
  }

  async function generarPDFBlob() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('No se cargó la biblioteca PDF. Revisá la conexión y volvé a intentar.');
    const doc = new jsPDF({unit:'pt', format:'a4'});
    doc.setProperties({title:'Parte de instalación', author:'Agronomía Inteligente SRL', subject:'Registro de visita técnica y evidencia fotográfica'});
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const M = 48, contentW = W - 2*M;
    let y = 98;
    const timestamp = new Date().toLocaleString('es-AR');
    function page() { doc.addPage(); y = 98; }
    function ensure(height) { if (y + height > H - 56) page(); }
    function title(text, detail) {
      ensure(detail ? 89 : 69);
      y += 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(25);
      doc.text(clean(text), M, y); y += 17;
      if (detail) {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(85);
        const lines = doc.splitTextToSize(clean(detail), contentW);
        doc.text(lines, M, y); y += lines.length*12 + 6;
      } else y += 4;
    }
    function table(rows, heading, paired = false) {
      const columns = paired
        ? {0:{cellWidth:108,fontStyle:'bold'},1:{cellWidth:contentW/2-108},2:{cellWidth:108,fontStyle:'bold'},3:{cellWidth:contentW/2-108}}
        : {0:{cellWidth:170,fontStyle:'bold'},1:{cellWidth:contentW-170}};
      doc.autoTable({
        startY:y, head:heading ? [[clean(heading), 'Detalle']] : undefined,
        body:rows.map(row => row.map(clean)), theme:'plain',
        styles:{font:'helvetica',fontSize:9,cellPadding:5,textColor:35,overflow:'linebreak',lineColor:225,lineWidth:{bottom:.4}},
        headStyles:{fillColor:240,textColor:25,fontStyle:'bold'},
        columnStyles:columns, rowPageBreak:'avoid',
        margin:{left:M,right:M,top:98,bottom:56},
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    function pairs(rows) {
      const combined = [];
      for (let i=0; i<rows.length; i+=2) combined.push([...rows[i], ...(rows[i+1] || ['', ''])]);
      table(combined, undefined, true);
    }
    title(`Datos del servicio | ${$$('.cam-card').length} cámara(s)`);
    pairs([
      ['Cliente',value('cliNombre')],['Teléfono de contacto',value('cliTel')],
      ['Dirección / establecimiento',value('cliDireccion')],['Localidad y provincia',value('cliCiudad')],
      ['Técnico responsable',value('tecNombre')],['Fecha de la visita',value('fechaInst')],
    ]);

    const photoQueue = [];
    for (const [i, camera] of $$('.cam-card').entries()) {
      ensure(150); const id = camera.dataset.cam;
      const input = suffix => camera.querySelector(`[name="${id}_${suffix}"]`);
      const field = suffix => input(suffix)?.value?.trim() || 'Sin registrar';
      const checked = suffix => camera.querySelector(`#${id}_${suffix}`);
      const measurement = suffix => checked(`${suffix}_na`)?.checked ? 'No aplica' : field(suffix);
      title(`Cámara ${i+1} | Registro técnico`);
      pairs([
        ['Trabajo realizado',camera.querySelector(`#${id}_tipo option:checked`)?.textContent || 'Sin registrar'],
        ['Estructura de montaje',camera.querySelector(`#${id}_estructura`)?.value || 'Sin registrar'],
        ['Modelo de cámara',field('modelo')],['Número de serie',field('serie')],
        ['Fuente de alimentación',field('conexion')],['Marca y modelo del módem',measurement('modem')],
        ['Operador de la SIM',field('operador')],['Señal celular (dBm)',field('rssi')],
        ['Velocidad: subida / bajada (Mbps)',measurement('vel')],
        ['Señal del radioenlace (dBm)',measurement('radio')],['Tensión medida (V)',measurement('volt')],
        ['Latitud (GMS)',field('latGms')],['Longitud (GMS)',field('lonGms')],
      ]);
      ensure(100);
      pairs([
        ['Ubicación confirmada',yes(checked('chkUbic'))],['Revisión satelital',yes(checked('chkSat'))],
        ['Herramientas disponibles',yes(checked('chkHerr'))],
        ['Imagen en vivo comprobada',yes(checked('t_vivo'))],['Notificaciones comprobadas',yes(checked('t_noti'))],
        ['Grabación microSD',yes(checked('t_sd'))],['Detección de movimiento',yes(checked('t_evt'))],
        ['Carga del panel solar',yes(checked('t_panel'))],
      ]);
      const photos = $$('input[type=file]',camera).filter(el => el.files[0]);
      for (const [index, input] of photos.entries()) photoQueue.push({camera:i+1,index:index+1,total:photos.length,input});
    }

    title('Revisión y cierre de la visita');
    table([['Observaciones del técnico',value('obs')]]);
    pairs([
      ['Cableado revisado',yes($('#okCableado'))],['Montura revisada',yes($('#okMontura'))],
      ['Protección contra cotorras',yes($('#okCotorra'))],['Oficina ve las cámaras',yes($('#confOficina'))],
      ['Confirmó desde oficina',value('validador')],['Hora de confirmación',value('horaConf')],
    ]);
    ensure(88);
    doc.setFont('helvetica','bold'); doc.setTextColor(35); doc.setFontSize(11);
    doc.text('Firma del técnico responsable',M,y); y += 12;
    const canvas = $('#canvasFirm');
    if (canvas?.width && canvas?.height) {
      const scale = Math.min(280/canvas.width,54/canvas.height);
      const width = canvas.width*scale, height = canvas.height*scale;
      doc.addImage(canvas.toDataURL('image/png'),'PNG',M,y,width,height);
    }
    doc.setDrawColor(180); doc.setLineWidth(.5); doc.line(M,y+58,M+280,y+58);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(clean(value('tecNombre')),M,y+71);

    y += 88;
    // Evidence follows the signed report. Place large images in the available
    // space; add a page only when a full, readable photograph will not fit.
    for (const item of photoQueue) {
      const data = await photoData(item.input.files[0]);
      const dimensions = doc.getImageProperties(data);
      const scale = Math.min(contentW/dimensions.width, (dimensions.height > dimensions.width ? 560 : 300)/dimensions.height);
      const width = dimensions.width*scale, height = dimensions.height*scale;
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      const caption = doc.splitTextToSize(clean(item.input.dataset.caption), contentW);
      ensure(34 + caption.length*12 + height);
      title(`Cámara ${item.camera} | Evidencia ${item.index} de ${item.total}`);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(70);
      doc.text(caption,M,y); y += caption.length*12 + 8;
      doc.addImage(data,'JPEG',M+(contentW-width)/2,y,width,height,undefined,'FAST');
      y += height+20;
    }

    // Repeated, reserved header/footer on every page, including AutoTable continuations.
    const count = doc.internal.getNumberOfPages();
    const logo = $('#logoImg');
    for (let number=1; number<=count; number++) {
      doc.setPage(number);
      if (logo?.complete && logo.naturalWidth) {
        const height=42, width=height*logo.naturalWidth/logo.naturalHeight;
        doc.addImage(logo,'PNG',M,25,width,height);
      }
      doc.setTextColor(25); doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.text(clean('AGRONOMÍA INTELIGENTE SRL'),W-M,37,{align:'right'});
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text('Parte de instalación y servicio técnico',W-M,53,{align:'right'});
      doc.setDrawColor(175); doc.setLineWidth(.6); doc.line(M,78,W-M,78);
      doc.setDrawColor(210); doc.line(M,H-46,W-M,H-46);
      doc.setTextColor(90); doc.setFontSize(8);
      doc.text(clean(`Emitido: ${timestamp}`),M,H-30);
      doc.text(`Página ${number} de ${count}`,W-M,H-30,{align:'right'});
    }
    return doc.output('blob');
  }
  window.crearPDF = generarPDFBlob;
  window.descargarPDF = async (blob,filename) => {
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url; link.download=filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
})();
