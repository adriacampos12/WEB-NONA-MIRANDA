const crypto = require('crypto');

const ORIGENES = ['https://www.nonamiranda.pe', 'https://nonamiranda.pe'];

function env(nombre) {
  return process.env[nombre] || '';
}

async function sb(ruta, opts = {}) {
  const url = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Falta configuracion de Supabase');
  const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  if (opts.prefer) headers.Prefer = opts.prefer;
  const r = await fetch(url + '/rest/v1/' + ruta, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const texto = await r.text();
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + texto.slice(0, 300));
  return texto ? JSON.parse(texto) : null;
}

function izipay() {
  const prod = env('IZIPAY_MODE') === 'PROD';
  return {
    prod,
    username: env('IZIPAY_USERNAME'),
    password: env(prod ? 'IZIPAY_PASSWORD_PROD' : 'IZIPAY_PASSWORD_TEST'),
    hmac: env(prod ? 'IZIPAY_HMAC_PROD' : 'IZIPAY_HMAC_TEST'),
    publicKey: env(prod ? 'IZIPAY_PUBLICKEY_PROD' : 'IZIPAY_PUBLICKEY_TEST'),
  };
}

function firmaValida(krAnswer, krHash, clave) {
  if (!clave || !krAnswer || !krHash) return false;
  const calculada = crypto.createHmac('sha256', clave).update(String(krAnswer), 'utf8').digest('hex');
  const a = Buffer.from(calculada);
  const b = Buffer.from(String(krHash).toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cuerpo(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try {
      b = JSON.parse(b);
    } catch (e) {
      b = Object.fromEntries(new URLSearchParams(b));
    }
  }
  return b || {};
}

function txt(valor, max) {
  return String(valor === undefined || valor === null ? '' : valor).trim().slice(0, max);
}

function soloPost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Metodo no permitido' });
    return false;
  }
  return true;
}

function origenOk(req, res) {
  if (!ORIGENES.includes(req.headers.origin || '')) {
    res.status(403).json({ ok: false, error: 'Origen no permitido' });
    return false;
  }
  return true;
}

async function marcarPagado(numero, centavos, origen, payload) {
  const filtro = 'pedidos?numero=eq.' + encodeURIComponent(numero);
  const filas = await sb(filtro + '&select=numero,total,estado_pago');
  await sb('pagos_eventos', { method: 'POST', body: { pedido_numero: numero, origen, payload } });
  if (!filas.length) return { encontrado: false, coincide: false };
  const pedido = filas[0];
  const esperado = Math.round(Number(pedido.total) * 100);
  const coincide = centavos === null || centavos === undefined || Math.abs(Number(centavos) - esperado) <= 1;
  if (pedido.estado_pago !== 'pagado') {
    // el filtro por estado hace que solo una confirmación (IPN o navegador) actualice y envíe los correos
    const actualizados = await sb(filtro + '&estado_pago=neq.pagado', {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        estado_pago: coincide ? 'pagado' : 'monto_no_coincide',
        pagado_en: new Date().toISOString(),
        monto_pagado: centavos === null || centavos === undefined ? null : Number(centavos) / 100,
      },
    });
    if (actualizados && actualizados.length && (coincide || pedido.estado_pago !== 'monto_no_coincide')) {
      try {
        await require('./_correo').avisarPago(actualizados[0], coincide);
      } catch (e) {
        console.error('correo', e.message);
      }
    }
  }
  return { encontrado: true, coincide };
}

module.exports = { env, sb, izipay, firmaValida, cuerpo, txt, soloPost, origenOk, marcarPagado };
