/* ===== PDF + compartir por WhatsApp (sin emojis en el PDF) ===== */

(function () {
  const WA_NUMBER_INTL = '5491160301418'; // +54 9 11 6030-1418 (sin símbolos)
  const WA_TEXT = 'Hola, te envío el parte de instalación.';

  // Quita emojis y pictogramas para evitar caracteres raros en PDF
  function stripEmoji(str = '') {
    // rango amplio de pictogramas + símbolos combinados
    return String(str).replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF]|[\u2190-\u21FF]|[\u2600-\u26FF])/g,
      ''
    );
  }
  const clean = (v) => stripEmoji(v ?? '');

  // Helper UI
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  function readImageAsDataURL(file, maxW = 720, quality = 0.82) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const img = new Image(),
        fr = new FileReader();
      fr.onload = () => (img.src = fr.result);
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      fr.readAsDataURL(file);
    });
  }

  // Generar Blob del PDF
  async function generarPDFBlob() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('jsPDF no cargado');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 56;
    let y = M;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(clean('Agronomía Inteligente SRL — Parte de instalación'), M, y);
    y += 22;
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(2);
    doc.line(M, y, pageW - M, y);
    y += 16;

    // A) Datos del servicio
    const A = [
      ['Cliente', clean($('#cliNombre')?.value || '')],
      ['Teléfono', clean($('#cliTel')?.value || '')],
      ['Dirección', clean($('#cliDireccion')?.value || '')],
      ['Ciudad/Prov.', clean($('#cliCiudad')?.value || '')],
      ['Técnico', clean($('#tecNombre')?.value || '')],
      ['Fecha', clean($('#fechaInst')?.value || '')],
    ];
    doc.autoTable({
      startY: y,
      head: [[clean('A) Datos del servicio'), clean('Valor')]],
      body: A,
      theme: 'grid',
      styles: { fontSize: 9.5, cellPadding: 5 },
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 12;

    // Cada cámara
    for (const [i, el] of $$('.cam-card', $('#camList')).entries()) {
      if (y > pageH - 280) {
        doc.addPage();
        y = M;
      }
      const id = el.dataset.cam;
      const blockX = M - 6,
        blockW = pageW - 2 * M + 12;
      const padTop = 18;
      let y0 = y + padTop;

      // Título cámara
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(clean(el.querySelector('.cam-title')?.textContent || `Cámara #${i + 1}`), M, y0);
      y0 += 12;

      // A0 por cámara
      const A0 = [
        ['Tipo de trabajo', clean(el.querySelector(`#${id}_tipo`)?.value || '—')],
        ['Estructura', clean(el.querySelector(`#${id}_estructura`)?.value || '—')],
        ['Ubicación confirmada', el.querySelector(`#${id}_chkUbic`)?.checked ? 'Sí' : 'No'],
        ['Revisión con imagen satelital', el.querySelector(`#${id}_chkSat`)?.checked ? 'Sí' : 'No'],
        ['Herramientas básicas presentes', el.querySelector(`#${id}_chkHerr`)?.checked ? 'Sí' : 'No'],
      ];
      doc.autoTable({
        startY: y0,
        head: [[clean('A0) Parámetros técnicos'), clean('Valor')]],
        body: A0.map(([k, v]) => [clean(k), clean(String(v))]),
        theme: 'grid',
        styles: { fontSize: 9.5, cellPadding: 4 },
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: M, right: M },
      });
      y0 = doc.lastAutoTable.finalY + 8;

      // Datos de cámara
      const modemNA = el.querySelector(`#${id}_modem_na`)?.checked;
      const radioNA = el.querySelector(`#${id}_radio_na`)?.checked;
      const voltNA = el.querySelector(`#${id}_volt_na`)?.checked;
      const velNA = el.querySelector(`#${id}_vel_na`)?.checked;

      const body = [
        ['Modelo', el.querySelector(`[name="${id}_modelo"]`)?.value || ''],
        ['Serie', el.querySelector(`[name="${id}_serie"]`)?.value || ''],
        ['Tipo de conexión', el.querySelector(`[name="${id}_conexion"]`)?.value || ''],
        ['Módem (marca/modelo)', modemNA ? 'No aplica' : (el.querySelector(`[name="${id}_modem"]`)?.value || '')],
        ['Operador', el.querySelector(`[name="${id}_operador"]`)?.value || ''],
        ['APN', el.querySelector(`[name="${id}_apn"]`)?.value || ''],
        [
          'APN usuario/password',
          (() => {
            const u = el.querySelector(`[name="${id}_apn_user"]`)?.value || '';
            const p = el.querySelector(`[name="${id}_apn_pass"]`)?.value || '';
            return u || p ? `${u} / ${p}` : '—';
          })(),
        ],
        ['Señal (dBm)', el.querySelector(`[name="${id}_rssi"]`)?.value || ''],
        ['Velocidad', velNA ? 'No aplica' : (el.querySelector(`[name="${id}_vel"]`)?.value || '')],
        ['Potencia radioenlace (dBm)', radioNA ? 'No aplica' : (el.querySelector(`[name="${id}_radio"]`)?.value || '')],
        ['Tensión (V)', voltNA ? 'No aplica' : (el.querySelector(`[name="${id}_volt"]`)?.value || '')],
        [
          'Lat/Lon (GMS)',
          `${el.querySelector(`[name="${id}_latGms"]`)?.value || ''} , ${el.querySelector(`[name="${id}_lonGms"]`)?.value || ''}`,
        ],
      ].map(([k, v]) => [clean(k), clean(v)]);
      doc.autoTable({
        startY: y0,
        body,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: M, right: M },
      });
      y0 = doc.lastAutoTable.finalY + 8;

      // Pruebas
      const tests = [
        ['Vista en vivo', el.querySelector(`#${id}_t_vivo`)?.checked ? 'Sí' : 'No'],
        ['Notificaciones en la app del cliente', el.querySelector(`#${id}_t_noti`)?.checked ? 'Sí' : 'No'],
        ['Micro SD grabando', el.querySelector(`#${id}_t_sd`)?.checked ? 'Sí' : 'No'],
        ['Eventos / movimientos', el.querySelector(`#${id}_t_evt`)?.checked ? 'Sí' : 'No'],
        ['Carga del panel solar', el.querySelector(`#${id}_t_panel`)?.checked ? 'Sí' : 'No'],
      ].map(([k, v]) => [clean(k), clean(v)]);
      doc.autoTable({
        startY: y0,
        head: [[clean('Prueba'), clean('OK')]],
        body: tests,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: M, right: M },
      });
      y0 = doc.lastAutoTable.finalY + 10;

      // Fotos
      const keys = ['Poste', 'Vivo', 'Carga', 'Fij', 'Senal', 'CamPoste'];
      const items = [];
      for (const k of keys) {
        const inp = el.querySelector(`#${id}_${k}`);
        const f = inp?.files?.[0];
        if (!f) continue;
        const data = await readImageAsDataURL(f, 420, 0.82);
        items.push({ data, caption: clean(inp.dataset.caption || k) });
      }
      if (items.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(clean('Fotos'), M, y0);
        y0 += 6;

        const size = 110,
          gap = 10;
        let x = M,
          rowH = size + 22;
        for (const it of items) {
          if (x + size > pageW - M) {
            x = M;
            y0 += rowH;
          }
          if (y0 + size + 18 > pageH - M) {
            // cerrar marco de bloque y nueva página
            const blockY = y + 2;
            const blockH = y0 - y + 10;
            doc.setLineWidth(0.8);
            doc.setDrawColor(0, 0, 0);
            doc.roundedRect(blockX, blockY, blockW, blockH, 4, 4, 'S');
            doc.setLineWidth(0.6);
            doc.setDrawColor(245, 158, 11);
            doc.roundedRect(blockX + 2, blockY + 2, blockW - 4, blockH - 4, 3, 3, 'S');

            doc.addPage();
            y = M;
            y0 = y + padTop;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(clean(`${el.querySelector('.cam-title').textContent} (cont.)`), M, y0);
            y0 += 12;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(clean('Fotos (cont.)'), M, y0);
            y0 += 6;
            x = M;
          }
          doc.addImage(it.data, 'JPEG', x, y0, size, size);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.text(doc.splitTextToSize(it.caption, size), x, y0 + size + 12);
          x += size + gap;
        }
        y0 += rowH;
      }

      // Marco del bloque de la cámara
      const blockY = y + 2;
      const blockH = y0 - y + 8;
      doc.setLineWidth(0.8);
      doc.setDrawColor(0, 0, 0);
      doc.roundedRect(blockX, blockY, blockW, blockH, 4, 4, 'S');
      doc.setLineWidth(0.6);
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(blockX + 2, blockY + 2, blockW - 4, blockH - 4, 3, 3, 'S');

      y = blockY + blockH + 12;
    }

    // Observaciones
    if (y > pageH - 200) {
      doc.addPage();
      y = M;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(clean('Observaciones generales'), M, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(clean($('#obs')?.value || '—'), pageW - 2 * M), M, y);
    y += 36;

    // Calidad
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(clean('Calidad y seguridad'), M, y);
    y += 10;
    const qual = [
      ['Conexiones y cableado OK', $('#okCableado')?.checked ? 'Sí' : 'No'],
      ['Montura verificada', $('#okMontura')?.checked ? 'Sí' : 'No'],
      ['Protección contra cotorras', $('#okCotorra')?.checked ? 'Sí' : 'No'],
    ].map(([k, v]) => [clean(k), clean(v)]);
    doc.autoTable({
      startY: y,
      body: qual,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 18;

    // Cierre técnico + firma
    if (y > pageH - 180) {
      doc.addPage();
      y = M;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(clean('Cierre del técnico'), M, y);
    y += 10;

    const sig = $('#canvasFirm');
    const dni = clean($('#dniTec')?.value || '');
    const hIni = clean($('#horaIni')?.value || '');
    const hFin = clean($('#horaFin')?.value || '');
    const horaConf = clean($('#horaConf')?.value || '');
    const validador = clean($('#validador')?.value || '');
    const confOf = $('#confOficina')?.checked ? 'Sí' : 'No';

    if (sig && sig.width && sig.height) {
      const data = sig.toDataURL('image/png');
      doc.addImage(data, 'PNG', M, y, 220, 110);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(clean(`DNI: ${dni}`), M + 240, y + 24);
      doc.text(clean(`Hora inicio: ${hIni}`), M + 240, y + 44);
      doc.text(clean(`Hora fin: ${hFin}`), M + 240, y + 64);
      doc.text(clean(`Confirmación oficina: ${confOf}`), M + 240, y + 84);
      if (horaConf) doc.text(clean(`Hora confirmación: ${horaConf}`), M + 240, y + 104);
      if (validador) doc.text(clean(`Validador: ${validador}`), M + 240, y + 124);
    }

    // Footer
    doc.setDrawColor(229, 231, 235);
    doc.line(M, pageH - 48, pageW - M, pageH - 48);
    doc.setFontSize(9.5);
    doc.text(clean(`Generado — ${new Date().toLocaleString()}`), M, pageH - 34);

    // → devolvemos Blob
    return doc.output('blob');
  }

  async function descargar(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function compartirWhatsApp(blob, filename) {
    // 1) Intento compartir el archivo con Web Share
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Parte de instalación',
          text: WA_TEXT,
        });
        return;
      }
    } catch (e) {
      // sigue con fallback
    }

    // 2) Fallback: abrir chat con texto (sin adjunto en desktop/web)
    const url = `https://wa.me/${WA_NUMBER_INTL}?text=${encodeURIComponent(WA_TEXT)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // API pública
  window.generarPDFyCompartir = async function () {
    const dateStr = $('#fechaInst')?.value || new Date().toISOString().slice(0, 10);
    const filename = `parte-instalacion-${dateStr}.pdf`;

    const blob = await generarPDFBlob();
    await descargar(blob, filename);
    await compartirWhatsApp(blob, filename);
  };
})();
