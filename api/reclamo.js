const { sb, cuerpo, txt, soloPost, origenOk } = require('./_lib');
const { enviarCorreo, TIENDA } = require('./_correo');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const d = cuerpo(req);
    const tipo = txt(d.tipo, 10).toUpperCase() === 'QUEJA' ? 'QUEJA' : 'RECLAMO';
    const fila = {
      tipo,
      nombre: txt(d.nombre, 120),
      dni: txt(d.dni, 20),
      telefono: txt(d.telefono, 30),
      correo: txt(d.correo, 120),
      domicilio: txt(d.domicilio, 250),
      apoderado: txt(d.apoderado, 250) || null,
      bien: txt(d.bien, 40) || null,
      descripcion: txt(d.descripcion, 500) || null,
      monto: txt(d.monto, 20) || null,
      hechos: txt(d.hechos, 3000),
      pedido_consumidor: txt(d.pedidoConsumidor, 1500),
    };
    if (!fila.nombre || !fila.dni || !fila.telefono || !fila.domicilio || !fila.hechos || !fila.pedido_consumidor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fila.correo)) {
      return res.status(400).json({ ok: false, error: 'Datos incompletos' });
    }
    const creado = await sb('reclamos', { method: 'POST', prefer: 'return=representation', body: fila });
    const r = creado[0];
    const hoja =
      'LIBRO DE RECLAMACIONES — HOJA N.º ' + r.hoja + '\nTipo: ' + r.tipo + '\nFecha: ' + new Date(r.creado_en).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) +
      '\n\nCONSUMIDOR\nNombre: ' + r.nombre + '\nDNI/CE: ' + r.dni + '\nTeléfono: ' + r.telefono + '\nCorreo: ' + r.correo + '\nDomicilio: ' + r.domicilio +
      (r.apoderado ? '\nMenor de edad — Apoderado: ' + r.apoderado : '') +
      '\n\nBIEN CONTRATADO: ' + (r.bien || '') + (r.descripcion ? '\nDescripción: ' + r.descripcion : '') + (r.monto ? '\nMonto reclamado: S/ ' + r.monto : '') +
      '\nHechos: ' + r.hechos + '\nPedido del consumidor: ' + r.pedido_consumidor;
    await enviarCorreo({ to: TIENDA, replyTo: r.correo, subject: 'Libro de Reclamaciones — Hoja N.º ' + r.hoja + ' (' + r.tipo + ')', text: hoja });
    await enviarCorreo({ to: r.correo, replyTo: TIENDA, desde: 'Nona Miranda', subject: 'Copia de tu ' + r.tipo.toLowerCase() + ' — Hoja N.º ' + r.hoja, text: 'Hemos recibido tu ' + r.tipo.toLowerCase() + '. Esta es tu copia.\n\n' + hoja + '\n\nNos pondremos en contacto contigo dentro del plazo legal.' });
    return res.status(200).json({ ok: true, hoja: r.hoja });
  } catch (e) {
    console.error('reclamo', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar el reclamo' });
  }
};
