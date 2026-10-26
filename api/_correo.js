const nodemailer = require('nodemailer');

const TIENDA = 'infononamiranda@gmail.com';
const WHATSAPP = '51913796342';
const LOGO = 'https://www.nonamiranda.pe/logo-1783103585770.png';

function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function soles(n) {
  return 'S/ ' + Number(n || 0).toFixed(2);
}

function lineas(pedido) {
  const items = Array.isArray(pedido.productos_json) ? pedido.productos_json : [];
  return items
    .map(
      (it) =>
        '<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#0a0a0a">' +
        esc(it.nombre) + ' &times; ' + esc(it.cantidad) +
        '</td><td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#0a0a0a">' +
        soles(it.precio * it.cantidad) + '</td></tr>'
    )
    .join('');
}

function entregaTexto(pedido) {
  const lugar = [pedido.distrito, pedido.provincia, pedido.departamento].filter(Boolean).join(', ');
  if (pedido.entrega === 'Motorizado') return 'Motorizado a: ' + pedido.direccion + (lugar ? ' — ' + lugar : '');
  return 'Recojo en agencia ' + (pedido.courier || '') + ': ' + pedido.direccion + (lugar ? ' — ' + lugar : '');
}

function htmlCliente(p) {
  const nombre = esc(String(p.nombre || '').split(' ')[0]);
  const envio = p.envio === 'GRATIS' ? 'GRATIS' : soles(p.envio);
  return (
    '<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 0"><tr><td align="center">' +
    '<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff">' +
    '<tr><td align="center" style="padding:28px 24px;border-bottom:1px solid #0a0a0a"><img src="' + LOGO + '" alt="Nona Miranda" height="48" style="display:block;height:48px"></td></tr>' +
    '<tr><td style="padding:32px 32px 8px">' +
    '<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#777">CONFIRMACIÓN DE PEDIDO</p>' +
    '<h1 style="margin:0 0 16px;font-size:24px;color:#0a0a0a">¡Gracias por tu compra, ' + nombre + '!</h1>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3a3a3a">Recibimos tu pago y ya estamos preparando tu pedido.</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a"><tr><td style="padding:18px 20px">' +
    '<p style="margin:0;font-size:11px;letter-spacing:2px;color:#bbb">TU CÓDIGO DE PEDIDO</p>' +
    '<p style="margin:4px 0 0;font-size:26px;font-weight:bold;letter-spacing:2px;color:#ffffff">' + esc(p.numero) + '</p>' +
    '</td><td align="right" style="padding:18px 20px"><span style="display:inline-block;background:#1f8a5b;color:#fff;font-size:12px;font-weight:bold;letter-spacing:1px;padding:6px 10px">PAGO RECIBIDO</span></td></tr></table>' +
    '<p style="margin:10px 0 0;font-size:12px;color:#777">Guarda este código: lo necesitarás para cualquier consulta sobre tu pedido.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:24px 32px 0"><p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#777">RESUMEN</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0">' + lineas(p) +
    '<tr><td style="padding:8px 0 0;font-size:13px;color:#555">Subtotal</td><td align="right" style="padding:8px 0 0;font-size:13px;color:#555">' + soles(p.subtotal) + '</td></tr>' +
    '<tr><td style="padding:4px 0;font-size:13px;color:#555">Envío</td><td align="right" style="padding:4px 0;font-size:13px;color:#555">' + envio + '</td></tr>' +
    '<tr><td style="padding:10px 0;border-top:1px solid #0a0a0a;font-size:16px;font-weight:bold;color:#0a0a0a">Total pagado</td><td align="right" style="padding:10px 0;border-top:1px solid #0a0a0a;font-size:16px;font-weight:bold;color:#0a0a0a">' + soles(p.total) + '</td></tr>' +
    '</table></td></tr>' +
    '<tr><td style="padding:20px 32px 0"><p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#777">ENTREGA</p>' +
    '<p style="margin:0;font-size:14px;line-height:1.6;color:#0a0a0a">' + esc(entregaTexto(p)) + '</p>' +
    '<p style="margin:6px 0 0;font-size:14px;color:#0a0a0a"><strong>Fecha:</strong> ' + esc(p.fecha_entrega) + '</p>' +
    (p.entrega === 'Motorizado' ? '' : '<p style="margin:6px 0 0;font-size:13px;color:#555">Para recoger, presenta tu DNI y la clave de recojo que elegiste.</p>') +
    '</td></tr>' +
    '<tr><td style="padding:28px 32px"><table cellpadding="0" cellspacing="0"><tr><td style="background:#25d366;padding:12px 20px">' +
    '<a href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola Nona Miranda, consulto por mi pedido ' + p.numero) + '" style="color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none">Escríbenos por WhatsApp</a>' +
    '</td></tr></table></td></tr>' +
    '<tr><td align="center" style="background:#0a0a0a;padding:16px;font-size:11px;letter-spacing:1px;color:#999">NONA MIRANDA · nonamiranda.pe · +51 913 796 342</td></tr>' +
    '</table></td></tr></table></body></html>'
  );
}

function textoCliente(p) {
  return (
    'Gracias por tu compra en Nona Miranda.\n\n' +
    'Tu código de pedido: ' + p.numero + '\nEstado: Pago recibido, estamos preparando tu pedido.\n\n' +
    (Array.isArray(p.productos_json) ? p.productos_json.map((it) => '- ' + it.nombre + ' x' + it.cantidad).join('\n') : p.productos) +
    '\nTotal pagado: ' + soles(p.total) + '\n\n' + entregaTexto(p) + '\nFecha: ' + p.fecha_entrega +
    '\n\nConsultas por WhatsApp: +51 913 796 342'
  );
}

function textoTienda(p, coincide) {
  return (
    (coincide ? 'NUEVO PEDIDO PAGADO' : 'ATENCIÓN: EL MONTO PAGADO NO COINCIDE CON EL PEDIDO') + '\n\n' +
    'Pedido: ' + p.numero + '\nCliente: ' + p.nombre + '\nTeléfono: ' + p.telefono + '\nCorreo: ' + p.correo + '\nDNI: ' + p.dni +
    '\n\nProductos: ' + p.productos + '\nTotal: ' + soles(p.total) + (p.monto_pagado !== null && p.monto_pagado !== undefined ? '\nMonto cobrado por Izipay: ' + soles(p.monto_pagado) : '') +
    '\n\n' + entregaTexto(p) + '\nFecha de entrega: ' + p.fecha_entrega +
    '\nComprobante: ' + (p.comprobante || '') + (p.ruc ? ' (RUC ' + p.ruc + ' — ' + (p.razon_social || '') + ')' : '')
  );
}

// Con RESEND_API_KEY los correos salen desde el dominio (pedidos@nonamiranda.pe); si no, por Gmail.
function transporte() {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const remitente = process.env.CORREO_REMITENTE || 'pedidos@nonamiranda.pe';
    return {
      user: remitente,
      t: {
        sendMail: async (m) => {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: m.from, to: [m.to], reply_to: m.replyTo, subject: m.subject, html: m.html, text: m.text }),
          });
          if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()).slice(0, 200));
        },
      },
    };
  }
  const user = process.env.GMAIL_USER || TIENDA;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) throw new Error('Falta configuracion de correo');
  return { user, t: nodemailer.createTransport({ service: 'gmail', auth: { user, pass } }) };
}

async function avisarPago(pedido, coincide) {
  const { user, t } = transporte();
  if (coincide && pedido.correo) {
    await t.sendMail({
      from: 'Nona Miranda <' + user + '>',
      to: pedido.correo,
      replyTo: TIENDA,
      subject: 'Pedido ' + pedido.numero + ' confirmado — Nona Miranda',
      html: htmlCliente(pedido),
      text: textoCliente(pedido),
    });
  }
  await t.sendMail({
    from: 'Web Nona Miranda <' + user + '>',
    to: TIENDA,
    replyTo: pedido.correo || undefined,
    subject: (coincide ? 'Nuevo pedido pagado ' : 'REVISAR monto del pedido ') + pedido.numero + ' — ' + soles(pedido.total),
    text: textoTienda(pedido, coincide),
  });
}

module.exports = { avisarPago, htmlCliente };

// Correo generico (contacto y reclamos). No lanza error: devuelve true/false para no bloquear el registro.
async function enviarCorreo({ to, subject, text, replyTo, desde }) {
  try {
    const { user, t } = transporte();
    await t.sendMail({ from: (desde || 'Web Nona Miranda') + ' <' + user + '>', to, replyTo, subject, text });
    return true;
  } catch (e) {
    console.error('correo', e.message);
    return false;
  }
}

module.exports.enviarCorreo = enviarCorreo;
module.exports.TIENDA = TIENDA;
