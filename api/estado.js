const { sb, cuerpo, txt, soloPost, origenOk } = require('./_lib');

// Devuelve solo si el pedido ya figura como pagado (el aviso de Izipay es la fuente de verdad).
module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const numero = txt(cuerpo(req).numero, 40);
    const filas = await sb('pedidos?numero=eq.' + encodeURIComponent(numero) + '&select=estado_pago');
    return res.status(200).json({ ok: true, pagado: !!filas.length && filas[0].estado_pago === 'pagado' });
  } catch (e) {
    console.error('estado', e.message);
    return res.status(500).json({ ok: false });
  }
};
