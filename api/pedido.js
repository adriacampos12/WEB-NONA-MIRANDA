const { sb, cuerpo, txt, soloPost, origenOk } = require('./_lib');
const { PRECIOS, CUPONES } = require('./_catalogo');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const d = cuerpo(req);
    const nombre = txt(d.nombre, 120);
    const telefono = txt(d.telefono, 30);
    const dni = txt(d.dni, 20);
    const correo = txt(d.correo, 120);
    if (!nombre || !telefono || !dni || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ ok: false, error: 'Datos incompletos' });
    }

    const items = Array.isArray(d.items) ? d.items : [];
    if (!items.length || items.length > 30) {
      return res.status(400).json({ ok: false, error: 'Carrito vacio' });
    }
    let subtotal = 0;
    const lineas = [];
    for (const it of items) {
      const precio = PRECIOS[it.id];
      const cantidad = Math.floor(Number(it.cantidad));
      if (!precio || !(cantidad >= 1 && cantidad <= 50)) {
        return res.status(400).json({ ok: false, error: 'Producto no disponible' });
      }
      subtotal += precio * cantidad;
      lineas.push({ id: it.id, nombre: txt(it.nombre, 80), cantidad, precio });
    }
    const pct = CUPONES[txt(d.cupon, 30).toUpperCase()] || 0;
    const descuento = Math.round(subtotal * pct) / 100;
    const envio = subtotal >= 200 ? 0 : 12;
    const total = subtotal - descuento + envio;

    const fila = {
      nombre,
      telefono,
      correo,
      dni,
      productos: lineas.map((l) => l.nombre + ' x' + l.cantidad).join(' | '),
      productos_json: lineas,
      subtotal,
      envio: envio === 0 ? 'GRATIS' : String(envio),
      total,
      entrega: txt(d.entrega, 20),
      courier: txt(d.courier, 30),
      direccion: txt(d.direccion, 300),
      departamento: txt(d.departamento, 80),
      provincia: txt(d.provincia, 80),
      distrito: txt(d.distrito, 80),
      fecha_entrega: txt(d.fechaEntrega, 60),
      comprobante: txt(d.comprobante, 10),
      ruc: txt(d.ruc, 20),
      razon_social: txt(d.razonSocial, 160),
    };
    const creado = await sb('pedidos', { method: 'POST', prefer: 'return=representation', body: fila });
    return res.status(200).json({ ok: true, numero: creado[0].numero, total: Number(creado[0].total) });
  } catch (e) {
    console.error('pedido', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar el pedido' });
  }
};
