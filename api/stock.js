const { sb } = require('./_lib');

// Publico: solo devuelve cantidades de productos con stock controlado, para mostrar AGOTADO en la tienda.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const filas = await sb('stock?select=producto_id,cantidad&cantidad=not.is.null');
    const stock = {};
    filas.forEach((f) => {
      stock[f.producto_id] = f.cantidad;
    });
    return res.status(200).json({ ok: true, stock });
  } catch (e) {
    console.error('stock', e.message);
    return res.status(200).json({ ok: true, stock: {} });
  }
};
