const crypto = require('crypto');
const { sb, env, cuerpo, txt, soloPost, origenOk } = require('./_lib');

const ESTADOS = ['nuevo', 'preparando', 'enviado', 'entregado', 'cancelado'];
const DURACION = 12 * 60 * 60 * 1000;

function firmar(exp) {
  return crypto.createHmac('sha256', env('ADMIN_PASSWORD') + '|nm-admin').update(String(exp)).digest('hex');
}

function crearToken() {
  const exp = Date.now() + DURACION;
  return exp + '.' + firmar(exp);
}

function tokenValido(t) {
  const [exp, firma] = String(t || '').split('.');
  if (!exp || !firma || Number(exp) < Date.now()) return false;
  const a = Buffer.from(firmar(exp));
  const b = Buffer.from(firma);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function igual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!env('ADMIN_PASSWORD')) return res.status(500).json({ ok: false, error: 'Panel sin configurar' });
    const d = cuerpo(req);

    if (d.accion === 'login') {
      if (!igual(d.clave || '', env('ADMIN_PASSWORD'))) {
        await new Promise((r) => setTimeout(r, 1500));
        return res.status(401).json({ ok: false, error: 'Clave incorrecta' });
      }
      return res.status(200).json({ ok: true, token: crearToken() });
    }

    if (!tokenValido(d.token)) return res.status(401).json({ ok: false, error: 'Sesion vencida' });

    if (d.accion === 'datos') {
      const [pedidos, mensajes, reclamos, suscriptores, stock] = await Promise.all([
        sb('pedidos?select=*&order=numero.desc&limit=1000'),
        sb('mensajes_contacto?select=*&order=creado_en.desc&limit=500'),
        sb('reclamos?select=*&order=creado_en.desc&limit=500'),
        sb('suscriptores?select=*&order=creado_en.desc&limit=5000'),
        sb('stock?select=*&order=producto_id.asc'),
      ]);
      return res.status(200).json({ ok: true, pedidos, mensajes, reclamos, suscriptores, stock });
    }

    if (d.accion === 'stock') {
      const id = txt(d.id, 40);
      const vacio = d.cantidad === null || d.cantidad === '';
      const cant = Math.floor(Number(d.cantidad));
      if (!id || (!vacio && !(cant >= 0 && cant <= 100000))) return res.status(400).json({ ok: false, error: 'Dato invalido' });
      await sb('stock?producto_id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { cantidad: vacio ? null : cant } });
      return res.status(200).json({ ok: true });
    }

    if (d.accion === 'estado') {
      const estado = txt(d.estado, 20);
      const numero = txt(d.numero, 30);
      if (!ESTADOS.includes(estado) || !numero) return res.status(400).json({ ok: false, error: 'Dato invalido' });
      const filtro = 'pedidos?numero=eq.' + encodeURIComponent(numero);
      const antes = await sb(filtro + '&select=*');
      if (!antes.length) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
      await sb(filtro, { method: 'PATCH', body: { estado_envio: estado } });
      let correo = null;
      // aviso al cliente solo al pasar a "enviado" por primera vez y si el pedido esta pagado
      if (estado === 'enviado' && antes[0].estado_envio !== 'enviado' && antes[0].estado_pago === 'pagado') {
        try {
          await require('./_correo').avisarEnvio(antes[0]);
          correo = true;
        } catch (e) {
          console.error('correo envio', e.message);
          correo = false;
        }
      }
      return res.status(200).json({ ok: true, correo });
    }

    return res.status(400).json({ ok: false, error: 'Accion desconocida' });
  } catch (e) {
    console.error('admin', e.message);
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
};
