/* Parte técnico: composición editorial en escala de grises y fotos a página completa. */
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
    let y = 104;
    const timestamp = new Date().toLocaleString('es-AR');
    function page() { doc.addPage(); y = 104; }
    function title(text, detail) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(25);
      doc.text(clean(text), M, y); y += 19;
      if (detail) {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(85);
        const lines = doc.splitTextToSize(clean(detail), contentW);
        doc.text(lines, M, y); y += lines.length*12 + 10;
      } else y += 8;
    }
    function table(rows, heading, compact = false) {
      doc.autoTable({
        startY:y, head:heading ? [[clean(heading), 'Detalle']] : undefined,
        body:rows.map(row => row.map(clean)), theme:'plain',
        styles:{font:'helvetica', fontSize:compact ? 9 : 10, cellPadding:compact ? 5 : 8, textColor:35, overflow:'linebreak', lineColor:225, lineWidth:{bottom:.4}},
        headStyles:{fillColor:238, textColor:25, fontStyle:'bold'},
        columnStyles:{0:{cellWidth:200, fontStyle:'bold', textColor:65},1:{cellWidth:contentW-200}},
        rowPageBreak:'avoid', margin:{left:M,right:M,top:98,bottom:56},
      });
      y = doc.lastAutoTable.finalY + 22;
    }
    title('Datos del servicio', 'Identificación del cliente, lugar de la visita y técnico responsable.');
    table([
      ['Cliente',value('cliNombre')],['Teléfono de contacto',value('cliTel')],
      ['Dirección / establecimiento',value('cliDireccion')],['Localidad y provincia',value('cliCiudad')],
      ['Técnico responsable',value('tecNombre')],['Fecha de la visita',value('fechaInst')],
      ['Cámaras registradas',String($$('.cam-card').length)],
    ]);

    for (const [i, camera] of $$('.cam-card').entries()) {
      page(); const id = camera.dataset.cam;
      const input = suffix => camera.querySelector(`[name="${id}_${suffix}"]`);
      const field = suffix => input(suffix)?.value?.trim() || 'Sin registrar';
      const checked = suffix => camera.querySelector(`#${id}_${suffix}`);
      const measurement = suffix => checked(`${suffix}_na`)?.checked ? 'No aplica' : field(suffix);
      title(`Cámara ${i+1} | Registro técnico`);
      table([
        ['Trabajo realizado',camera.querySelector(`#${id}_tipo option:checked`)?.textContent || 'Sin registrar'],
        ['Estructura de montaje',camera.querySelector(`#${id}_estructura`)?.value || 'Sin registrar'],
        ['Modelo de cámara',field('modelo')],['Número de serie',field('serie')],
        ['Fuente de alimentación',field('conexion')],['Marca y modelo del módem',measurement('modem')],
        ['Operador de la SIM',field('operador')],['Señal celular (dBm)',field('rssi')],
        ['Velocidad: subida / bajada (Mbps)',measurement('vel')],
        ['Señal del radioenlace (dBm)',measurement('radio')],['Tensión medida (V)',measurement('volt')],
        ['Latitud (grados, minutos y segundos)',field('latGms')],['Longitud (grados, minutos y segundos)',field('lonGms')],
      ], undefined, true);
      table([
        ['Ubicación de montaje confirmada',yes(checked('chkUbic'))],['Ubicación revisada en mapa satelital',yes(checked('chkSat'))],
        ['Herramientas necesarias disponibles',yes(checked('chkHerr'))],
        ['Imagen en vivo comprobada',yes(checked('t_vivo'))],['Notificaciones de la app comprobadas',yes(checked('t_noti'))],
        ['Grabación en microSD comprobada',yes(checked('t_sd'))],['Detección de movimiento comprobada',yes(checked('t_evt'))],
        ['Carga del panel solar comprobada',yes(checked('t_panel'))],
      ],'Comprobaciones realizadas', true);
      const photos = $$('input[type=file]',camera).filter(el => el.files[0]);
      for (const [index, input] of photos.entries()) {
        page();
        title(`Cámara ${i+1} | Evidencia ${index+1} de ${photos.length}`, input.dataset.caption);
        const data = await photoData(input.files[0]);
        const dimensions = doc.getImageProperties(data);
        const availableH = H - 78 - y;
        const scale = Math.min(contentW/dimensions.width, availableH/dimensions.height);
        const width = dimensions.width*scale, height = dimensions.height*scale;
        const x = M + (contentW-width)/2, imageY = y + (availableH-height)/2;
        doc.addImage(data,'JPEG',x,imageY,width,height,undefined,'FAST');
      }
    }

    page(); title('Revisión y cierre de la visita');
    table([['Observaciones del técnico',value('obs')]],'Observaciones');
    table([
      ['Conexiones y cableado revisados',yes($('#okCableado'))],
      ['Montura y fijaciones revisadas',yes($('#okMontura'))],
      ['Protección contra cotorras revisada',yes($('#okCotorra'))],
    ],'Calidad de la instalación');
    table([
      ['Oficina confirmó que ve las cámaras',yes($('#confOficina'))],
      ['Persona de oficina que confirmó',value('validador')],
      ['Hora de confirmación de oficina',value('horaConf')],
    ],'Confirmación de oficina');
    if (y + 145 > H - 56) page();
    doc.setFont('helvetica','bold'); doc.setTextColor(35); doc.setFontSize(11);
    doc.text('Firma del técnico responsable',M,y); y += 12;
    const canvas = $('#canvasFirm');
    if (canvas?.width && canvas?.height) {
      const width = Math.min(280,contentW), height = Math.min(100,width*canvas.height/canvas.width);
      doc.addImage(canvas.toDataURL('image/png'),'PNG',M,y,width,height);
    }
    doc.setDrawColor(180); doc.setLineWidth(.5); doc.line(M,y+110,M+280,y+110);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(clean(value('tecNombre')),M,y+124);

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
