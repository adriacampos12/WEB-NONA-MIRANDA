const { izipay, firmaValida, cuerpo, soloPost, origenOk, marcarPagado } = require('./_lib');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const d = cuerpo(req);
    const z = izipay();
    if (!firmaValida(d.krAnswer, d.krHash, z.hmac)) {
      return res.status(200).json({ ok: false, error: 'firma invalida' });
    }
    const respuesta = JSON.parse(d.krAnswer);
    const pagado = respuesta.orderStatus === 'PAID';
    const detalle = respuesta.orderDetails || {};
    const numero = detalle.orderId || respuesta.orderId || '';
    const monto = typeof detalle.orderTotalAmount === 'number' ? detalle.orderTotalAmount : null;
    if (pagado && numero) await marcarPagado(numero, monto, 'navegador', respuesta);
    return res.status(200).json({ ok: true, pagado, numeroPedido: numero, montoPagado: monto });
  } catch (e) {
    console.error('izipay-confirmar', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo verificar el pago' });
  }
};
