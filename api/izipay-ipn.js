const { sb, izipay, firmaValida, cuerpo, env, marcarPagado } = require('./_lib');

// Izipay avisa aqui (servidor a servidor) cada vez que cambia el estado de un pago,
// aunque la clienta haya cerrado la pestana.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');
  try {
    const d = cuerpo(req);
    const z = izipay();
    const clave = d['kr-hash-key'] === 'password' ? z.password : z.hmac;
    if (!firmaValida(d['kr-answer'], d['kr-hash'], clave)) {
      await sb('pagos_eventos', { method: 'POST', body: { origen: 'ipn_firma_invalida', payload: { recibido: Object.keys(d) } } });
      return res.status(401).send('Firma invalida');
    }
    const respuesta = JSON.parse(d['kr-answer']);
    const detalle = respuesta.orderDetails || {};
    const numero = detalle.orderId || '';
    if (respuesta.orderStatus === 'PAID' && numero) {
      const monto = typeof detalle.orderTotalAmount === 'number' ? detalle.orderTotalAmount : null;
      await marcarPagado(numero, monto, 'ipn', respuesta);
    } else {
      await sb('pagos_eventos', { method: 'POST', body: { pedido_numero: numero || null, origen: 'ipn_' + String(respuesta.orderStatus || 'desconocido').toLowerCase(), payload: respuesta } });
    }
    return res.status(200).send('OK=Notificacion recibida');
  } catch (e) {
    console.error('izipay-ipn', e.message);
    return res.status(500).send('Error');
  }
};
